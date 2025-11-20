import { fieldSitesLimiter } from '../services/rateLimiterConcurrency';
import { log } from '../services/serviceLogging';
import { fetchJson } from '../utilities/fetchJsonFromRemote';
import {
  License,
  CommonDataset,
  AlternateIdentifier,
  RelatedIdentifier,
  Contact,
  Description,
  Geolocation,
  formatDate,
  ResponsibleOrganizations,
  EntityIdentifier,
  getLicenseURI,
  getChecksum,
} from '../models/commonStructure';

function extractSitesGeolocation(input: any): Geolocation[] {
  const coverageGeo = input.coverageGeo;
  if (!coverageGeo) {
    return [];
  }

  const coverages: Geolocation[] = [];
  let featuresToProcess: any[] = [];
  if (coverageGeo.type === 'FeatureCollection' && Array.isArray(coverageGeo.features)) {
    featuresToProcess = coverageGeo.features;
  } else if (coverageGeo.type === 'Feature') {
    featuresToProcess = [coverageGeo];
  } else {
    return [];
  }
  featuresToProcess.forEach((coverage: any) => {
    if (!coverage?.geometry) {
      return;
    }
    const geographicDescription = coverage.properties?.label || '';
    if (coverage.geometry.type === 'Point') {
      const coords = coverage.geometry.coordinates as number[];
      coverages.push({
        geographicDescription,
        point: {
          latitude: coords[1],
          longitude: coords[0],
        },
      });
    } else if (coverage.geometry.type === 'Polygon') {
      const coordinates = coverage.geometry.coordinates as number[][][];
      const points = coordinates[0].map((coord) => ({
        longitude: coord[0],
        latitude: coord[1],
      }));
      coverages.push({
        geographicDescription,
        boundingPolygon: [
          {
            points: points,
            inPolygonPoint: points.length > 0 ? points[0] : { longitude: 0, latitude: 0 },
          },
        ],
      });
    } else if (coverage.geometry?.type === 'LineString') {
      const coordinates = coverage.geometry.coordinates as number[][];
      if (coordinates && coordinates.length > 0) {
        const points = coordinates.map((coord) => ({ longitude: coord[0], latitude: coord[1] }));
        coverages.push({
          geographicDescription,
          lineString: points,
        });
      }
    }
  });
  return coverages;
}

// CRITICAL: externalSourceURI is used as database primary key (source_url)
// The return value `url` of this function is used as the externalSourceURI
// Do not modify this logic
async function handleFieldSitesVersioning(url: string, fieldSites: any): Promise<[string, any, RelatedIdentifier[]]> {
  const versionRelations: RelatedIdentifier[] = [];

  if (fieldSites.previousVersion) {
    const previousVersions = Array.isArray(fieldSites.previousVersion)
      ? fieldSites.previousVersion
      : [fieldSites.previousVersion];

    for (const prevUrl of previousVersions) {
      if (typeof prevUrl === 'string' && prevUrl) {
        versionRelations.push({
          relatedID: prevUrl,
          relatedIDType: 'URL',
          relatedResourceType: 'Dataset',
          relationType: 'IsNewVersionOf',
        });
      }
    }
  }

  if (fieldSites.latestVersion && fieldSites.latestVersion !== url) {
    versionRelations.push({
      relatedID: url,
      relatedIDType: 'URL',
      relatedResourceType: 'Dataset',
      relationType: 'IsNewVersionOf',
    });

    const latestVersionUrl = fieldSites.latestVersion;
    const latestVersionData = await fieldSitesLimiter.schedule(() => fetchJson(latestVersionUrl));
    if (latestVersionData) {
      log('warn', 'New version for record on url: ' + url + 'found: ' + latestVersionUrl);
      return [latestVersionUrl, latestVersionData, versionRelations];
    }
  }

  return [url, fieldSites, versionRelations];
}

export async function mapFieldSitesToCommonDatasetMetadata(
  url: string,
  recordData: any,
  sites: any,
): Promise<CommonDataset> {
  let fieldSites = recordData;
  const [latestUrl, latestData, versionRelations] = await handleFieldSitesVersioning(url, recordData);
  if (latestData) fieldSites = latestData;

  const licenses: License[] = [];
  if (fieldSites.references?.licence) {
    const licenseCode = fieldSites.references.licence.name;
    licenses.push({
      licenseCode: licenseCode,
      licenseURI: fieldSites.references.licence.url || (licenseCode ? getLicenseURI(licenseCode) : undefined),
    });
  }

  const responsibleOrganization: ResponsibleOrganizations[] = [];
  if (fieldSites.submission?.submitter) {
    const submitter = fieldSites.submission.submitter;
    const creatorIds: EntityIdentifier[] = [];
    if (submitter.website) {
      creatorIds.push({
        entityID: submitter.website,
      });
    }
    if (submitter.self?.uri && submitter.self?.uri != submitter.website) {
      creatorIds.push({
        entityID: submitter.self.uri,
      });
    }
    responsibleOrganization.push({
      organizationEmail: submitter.email,
      organizationName: submitter.name,
      organizationIDs: creatorIds,
    });
  }

  if (fieldSites.specificInfo?.acquisition?.station?.responsibleOrganization) {
    const org = fieldSites.specificInfo.acquisition.station.responsibleOrganization;
    const entityIds: EntityIdentifier[] = [];
    if (org.website) {
      entityIds.push({
        entityID: org.website,
      });
    }
    if (org.self?.uri && org.uri != org.website) {
      entityIds.push({
        entityID: org.uri,
      });
    }

    responsibleOrganization.push({
      organizationName: org.name,
    });
  }

  const alternateIdentifiers: AlternateIdentifier[] = [];
  if (fieldSites.pid) {
    alternateIdentifiers.push({
      alternateID: fieldSites.pid,
      alternateIDType: 'Handle',
    });
  }

  const relatedIdentifiers: RelatedIdentifier[] = [];
  relatedIdentifiers.push(...versionRelations);

  if (fieldSites.latestVersion && fieldSites.latestVersion !== url) {
    relatedIdentifiers.push({
      relatedID: fieldSites.latestVersion,
      relatedIDType: 'URL',
      relatedResourceType: 'Dataset',
      relationType: 'IsNewVersionOf',
    });
  }

  // add collection also to metadata
  if (fieldSites.parentCollections) {
    const parentCollections = Array.isArray(fieldSites.parentCollections)
      ? fieldSites.parentCollections
      : [fieldSites.parentCollections];

    parentCollections.forEach((collectionUrl: string) => {
      if (typeof collectionUrl === 'string' && collectionUrl.trim() !== '') {
        relatedIdentifiers.push({
          relatedID: collectionUrl,
          relatedIDType: 'URL',
          relatedResourceType: 'Collection',
          relationType: 'IsPartOf',
        });
      }
    });
  }

  const contactPoints: Contact[] = [];
  if (fieldSites.submission?.submitter?.email) {
    contactPoints.push({
      contactEmail: fieldSites.submission.submitter.email,
      contactName: fieldSites.submission.submitter.name,
    });
  }

  if (fieldSites.station?.org?.email && fieldSites.station?.org?.email !== fieldSites.submission?.submitter?.email) {
    contactPoints.push({
      contactEmail: fieldSites.station.org.email,
      contactName: fieldSites.station.org.name,
    });
  }

  const descriptions: Description[] = [];
  if (fieldSites.specification?.self?.comments && fieldSites.specification.self.comments.length > 0) {
    descriptions.push({
      descriptionText: fieldSites.specification.self.comments.join('\n'),
      descriptionType: 'Abstract',
    });
  }
  if (
    fieldSites.specificInfo?.acquisition?.station?.org?.self?.comments &&
    fieldSites.specificInfo.acquisition.station.org.self.comments.length > 0
  ) {
    descriptions.push({
      descriptionText: fieldSites.specificInfo.acquisition.station.org.self.comments.join('\n'),
      descriptionType: 'Other',
    });
  }

  const publicationDate = formatDate(
    fieldSites.references.temporalCoverageDisplay?.split('–')[0] || fieldSites.submission.start,
  );

  const temporalCoverages: { startDate?: string; endDate?: string }[] = [];
  if (fieldSites.references.temporalCoverageDisplay) {
    const [startDate, endDate] = fieldSites.references.temporalCoverageDisplay
      .split('–')
      .map((date: string) => formatDate(date.trim()));
    if (startDate && endDate) {
      temporalCoverages.push({ startDate, endDate });
    }
  }

  if (fieldSites.specificInfo?.acquisition?.interval) {
    const startDate = formatDate(fieldSites.specificInfo.acquisition.interval.start);
    const endDate = formatDate(fieldSites.specificInfo.acquisition.interval.stop);

    const newCoverage = { startDate, endDate };
    if (!temporalCoverages.some((tc) => tc.startDate === newCoverage.startDate && tc.endDate === newCoverage.endDate)) {
      temporalCoverages.push(newCoverage);
    }
  }

  const responsibleOrganizations: string[] = [];
  const respOrg = fieldSites.specificInfo?.acquisition?.station?.responsibleOrganization;
  if (respOrg) {
    responsibleOrganizations.push(respOrg.name);
  }
  const stationOrg = fieldSites.specificInfo?.acquisition?.station?.org;
  if (stationOrg && stationOrg.name != respOrg) {
    responsibleOrganizations.push(stationOrg.name);
  }

  return {
    pids: {
      doi: {
        identifier: fieldSites.pid,
        provider: 'doi.org',
      },
    },
    metadata: {
      assetType: 'Dataset',
      alternateIdentifiers: alternateIdentifiers,
      relatedIdentifiers: relatedIdentifiers,
      titles: [
        {
          titleText: fieldSites.references.title,
        },
      ],
      creators: [],
      contactPoints: contactPoints,
      descriptions: descriptions,
      keywords: fieldSites.specification?.keywords?.map((keyword: string) => ({
        keywordLabel: keyword,
      })),
      publicationDate: publicationDate,
      temporalCoverages: temporalCoverages,
      geoLocations: extractSitesGeolocation(fieldSites),
      licenses: licenses,
      files: [
        {
          name: fieldSites.fileName,
          sourceUrl: fieldSites.accessUrl,
          md5: getChecksum(fieldSites.hash),
          size: fieldSites.size.toString(),
          sizeMeasureType: 'B',
          format: fieldSites.fileName.split('.').pop(),
        },
      ],
      externalSourceInformation: {
        externalSourceName: 'FieldSites',
        // CRITICAL: externalSourceURI is used as database primary key (source_url)
        // DO NOT MODIFY THIS LOGIC
        externalSourceURI: latestUrl,
      },
      responsibleOrganizations: responsibleOrganization,
      projects: fieldSites.specification?.project?.self?.label
        ? [
            {
              projectName: fieldSites.specification.project.self.label,
              projectID: fieldSites.specification.project.self.uri,
            },
            {
              projectName: 'SITES external record - eLTER Community',
              projectID: 'https://meta.fieldsites.se/',
            },
          ]
        : [
            {
              projectName: 'SITES external record - eLTER Community',
              projectID: 'https://meta.fieldsites.se/',
            },
          ],
      siteReferences: sites,
      dataLevel: {
        dataLevelCode: fieldSites.specification.dataLevel.toString(),
      },
    },
  };
}
