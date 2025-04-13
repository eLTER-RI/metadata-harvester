import { B2ShareExtractedSchema } from './b2shareApi';
import {
  CommonDatasetMetadata,
  extractIdentifiers,
  Geolocation,
  License,
  Keywords,
  SiteReference,
} from './commonStructure';

// eslint-disable-next-line
function extractB2ShareGeolocation(input: any): Geolocation[] {
  const coverages: Geolocation[] = [];

  input.spatial_coverages?.map(
    // eslint-disable-next-line
    (spatCoverage: any) => {
      if (spatCoverage.point) {
        coverages.push({
          geographicDescription: spatCoverage.place,
          point: {
            latitude: spatCoverage.point.point_latitude,
            longitude: spatCoverage.point.point_longitude,
          },
        });
      }

      if (spatCoverage.box) {
        coverages.push({
          geographicDescription: spatCoverage.place ?? '',
          boundingBox: {
            westBoundLongitude: spatCoverage.box.westbound_longitude,
            eastBoundLongitude: spatCoverage.box.eastbound_longitude,
            northBoundLatitude: spatCoverage.box.northbound_latitude,
            southBoundLatitude: spatCoverage.box.southbound_latitude,
          },
        });
      }

      if (spatCoverage.polygons && spatCoverage.polygons.length > 0) {
        coverages.push({
          geographicDescription: spatCoverage.place,
          // eslint-disable-next-line
          boundingPolygon: spatCoverage.polygons.map((polygon: any) => ({
            // eslint-disable-next-line
            points:
              // eslint-disable-next-line
              polygon.polygon?.map((point: any) => ({
                longitude: point.point_longitude,
                latitude: point.point_latitude,
              })) || [],
            inPolygonPoint: polygon.inpoint
              ? {
                  longitude: polygon.inpoint.point_longitude,
                  latitude: polygon.inpoint.point_latitude,
                }
              : { longitude: 0, latitude: 0 },
          })),
        });
      }

      return {
        place: spatCoverage.place,
        type: 'unknown',
        coordinates: null,
        elevation: null,
        box: null,
      };
    },
  );
  return coverages || [];
}

// eslint-disable-next-line
function extractB2ShareKeywords(input: any): Keywords[] {
  const keywords: Keywords[] = [];
  // eslint-disable-next-line
  input.keywords?.forEach((k: any) => {
    if (typeof k === 'string') {
      const splitKeywords = k.split(/\s*[;,]\s*/);
      splitKeywords.forEach((keyword) => {
        keywords.push({
          keywordLabel: keyword,
        });
      });
    } else if (k?.keyword) {
      const splitKeywords = k.keyword.split(/\s*[;,]\s*/);
      splitKeywords.forEach((keyword: string) => {
        keywords.push({
          keywordLabel: keyword,
          keywordURI: k.scheme_uri,
        });
      });
    }
  });
  return keywords;
}
function formatDate(isoString: string) {
  try {
    return new Date(isoString)?.toISOString().split('T')[0];
  } catch (error) {
    console.error(`Error parsing ${isoString}:`, error);
  }
  return undefined;
}

function convertHttpToHttps(url: string): string {
  if (url.startsWith('http://')) {
    return 'https://' + url.slice(7);
  }
  return url;
}

export const mapB2ShareToCommonDatasetMetadata = (
  url: string,
  b2share: B2ShareExtractedSchema,
  siteReferences?: SiteReference[],
): CommonDatasetMetadata => {
  const licenses: License[] = [];
  if (
    b2share.metadata.license &&
    (b2share.metadata.license.license_identifier ||
      b2share.metadata.license.license)
  ) {
    licenses.push({
      licenseCode:
        b2share.metadata.license.license_identifier ||
        b2share.metadata.license.license,
      licenseURI: b2share.metadata.license.license_uri,
    });
  }

  return {
    assetType: 'Dataset',
    alternateIdentifiers: extractIdentifiers(b2share.metadata) || [],
    relatedIdentifiers: [],
    titles: b2share.metadata.titles.map((t) => ({
      titleText: t.title,
      titleType: t.type,
      titleLanguage: '',
    })),
    creators: b2share.metadata.creators?.map((c) => ({
      creatorFamilyName: c.family_name ?? c.creator_name,
      creatorGivenName: c.given_name ?? '',
      creatorEmail: '',
      creatorAffiliation:
        c.affiliations?.length != undefined && c.affiliations?.length > 0
          ? {
              entityName: c.affiliations[0].affiliation_name,
              entityID: {
                entityID: c.affiliations[0].affiliation_identifier,
                entityIDSchema: c.affiliations[0].scheme?.toLowerCase(),
              },
            }
          : undefined,
      creatorIDs: c.name_identifiers?.map((i) => ({
        entityID: i.name_identifier,
        entityIDSchema: i.scheme
          ? i.scheme.toLowerCase()
          : i.scheme_uri?.toLowerCase(),
      })),
    })),
    contactPoints: b2share.metadata.contact_email
      ? [
          {
            contactEmail: b2share.metadata.contact_email,
            contactName: '',
          },
        ]
      : undefined,
    descriptions: b2share.metadata.descriptions?.map((d) => ({
      descriptionText: d.description,
      descriptionType: d.description_type,
    })),
    keywords: extractB2ShareKeywords(b2share.metadata) || undefined,
    contributors: b2share.metadata.contributors?.map((c) => ({
      contributorFamilyName: c.family_name ?? c.contributor_name,
      contributorGivenName: c.given_name,
      contributorAffiliation:
        c.affiliations?.length != undefined && c.affiliations?.length > 0
          ? {
              entityName: c.affiliations[0].affiliation_name,
              entityID: {
                entityID: c.affiliations[0].affiliation_identifier,
                entityIDSchema: c.affiliations[0].scheme?.toLowerCase(),
              },
            }
          : undefined,
      contributorIDs: c.name_identifiers?.map((i) => ({
        entityID: i.name_identifier,
        entityIDSchema: i.scheme
          ? i.scheme?.toLowerCase()
          : i.scheme_uri?.toLowerCase(),
      })),
      contributorType: c.contributor_type,
    })),
    publicationDate: b2share.metadata.publication_date
      ? formatDate(b2share.metadata.publication_date)
      : undefined,
    temporalCoverages: b2share.metadata.temporal_coverages?.ranges?.map(
      (t) => ({
        startDate: t.start_date ? formatDate(t.start_date) : undefined,
        endDate: t.end_date ? formatDate(t.end_date) : undefined,
      }),
    ),
    geoLocations: extractB2ShareGeolocation(b2share.metadata),
    licenses: licenses.length > 0 ? licenses : undefined,
    files: b2share.files?.map((f) => ({
      name: f.key,
      sourceUrl: f.ePIC_PID ? convertHttpToHttps(f.ePIC_PID) : undefined,
      md5: f.checksum?.split(':').pop(),
      size: f.size?.toString(),
      sizeMeasureType: 'kB',
      format: f.key?.split('.').pop(),
    })),
    externalSourceInformation: {
      externalSourceName: 'b2share',
      externalSourceURI: url,
    },
    responsibleOrganizations: [],
    taxonomicCoverages: [],
    methods: [],
    projects: [],
    siteReferences: siteReferences,
    habitatReferences: [],
    additionalMetadata: [],
  };
};
