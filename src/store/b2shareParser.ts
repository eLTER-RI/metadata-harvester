import { B2ShareExtractedSchema } from './b2shareApi';
import {
  AlternateIdentifier,
  Geolocation,
  License,
  Keywords,
  CommonDataset,
  toPID,
  AdditionalMetadata,
  Contributor,
  validContributorTypes,
  // ContributorType,
  isValidEntityIdSchema,
  parsePID,
  ContributorType,
  extractAlternateIdentifiers,
  extractRelatedIdentifiers,
  normalizeDate,
  formatDate,
  getLicenseURI,
  getChecksum,
} from './commonStructure';

function extractB2ShareGeolocation(input: any): Geolocation[] {
  const coverages: Geolocation[] = [];

  input.spatial_coverages?.map((spatCoverage: any) => {
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
        boundingPolygon: spatCoverage.polygons.map((polygon: any) => ({
          points:
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
  });
  return coverages || [];
}

function extractB2ShareKeywords(input: any): Keywords[] {
  const keywords: Keywords[] = [];

  input.keywords?.forEach((k: any) => {
    if (typeof k === 'string') {
      const splitKeywords = k.split(/\s*[;,]\s*/);
      splitKeywords.forEach((keyword) => {
        if (keyword.length) {
          keywords.push({
            keywordLabel: keyword,
          });
        }
      });
    } else if (k?.keyword) {
      const splitKeywords = k.keyword.split(/\s*[;,]\s*/);
      splitKeywords.forEach((keyword: string) => {
        if (keyword.length) {
          keywords.push({
            keywordLabel: keyword,
            keywordURI: k.scheme_uri,
          });
        }
      });
    }
  });
  return keywords;
}
function formatDateB2Share(isoString: string): string | undefined {
  const normalized = normalizeDate(isoString);
  return normalized ? formatDate(normalized) : undefined;
}

function convertHttpToHttps(url: string): string {
  if (url.startsWith('http://')) {
    return 'https://' + url.slice(7);
  }
  return url;
}

function extractIdFromUrl(input: string): string {
  try {
    const url = new URL(input);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : input;
  } catch {
    return input;
  }
}

function parseB2shareAlternateIdentifiers(
  b2share: B2ShareExtractedSchema,
): [AlternateIdentifier[], AdditionalMetadata[]] {
  const [identifiers, additionalMetadata] = extractAlternateIdentifiers(b2share.metadata);
  if (b2share.metadata.ePIC_PID) {
    identifiers.push({
      alternateID: b2share.metadata.ePIC_PID as string,
      alternateIDType: 'Handle',
    });
  }
  return [identifiers, additionalMetadata];
}

function getAdditionalMetadata(b2share: B2ShareExtractedSchema): AdditionalMetadata[] {
  const additional_metadata: AdditionalMetadata[] = [];
  if (b2share.metadata.version) {
    additional_metadata.push({
      name: 'version',
      value: b2share.metadata.version,
    });
  }
  if (b2share.metadata.publication_state) {
    additional_metadata.push({
      name: 'publication_state',
      value: b2share.metadata.publication_state,
    });
  }
  if (b2share.metadata.community) {
    additional_metadata.push({
      name: 'community',
      value: b2share.metadata.community,
    });
  }

  if (b2share.metadata.open_access) {
    additional_metadata.push({
      name: 'access_right',
      value: b2share.metadata.open_access ? 'open' : 'not open',
    });
  }

  return additional_metadata;
}

export async function mapB2ShareToCommonDatasetMetadata(
  url: string,
  b2share: B2ShareExtractedSchema,
  sites: any,
  repositoryType: 'B2SHARE_EUDAT' | 'B2SHARE_JUELICH',
): Promise<CommonDataset> {
  const licenses: License[] = [];
  if (b2share.metadata.license && (b2share.metadata.license.license_identifier || b2share.metadata.license.license)) {
    const licenseCode: string | undefined =
      b2share.metadata.license.license_identifier || b2share.metadata.license.license;
    licenses.push({
      licenseCode: licenseCode,
      licenseURI: b2share.metadata.license.license_uri || (licenseCode ? getLicenseURI(licenseCode) : undefined),
    });
  }

  const [alternateIdentifiers, metadataFromAlternate] = parseB2shareAlternateIdentifiers(b2share);
  const [related_identifiers, metadataFromRelated] = extractRelatedIdentifiers(b2share.metadata);
  const additional_metadata = [...metadataFromAlternate, ...metadataFromRelated, ...getAdditionalMetadata(b2share)];
  const parsedPID = b2share.metadata.DOI ? parsePID(b2share.metadata.DOI) : null;
  const pids = parsedPID ?? toPID(alternateIdentifiers);

  const contributors = b2share.metadata.contributors?.map((c) => {
    const contributor: Contributor = {
      contributorFamilyName: c.family_name ?? c.contributor_name,
      contributorGivenName: c.given_name,
      contributorAffiliation:
        c.affiliations?.length != undefined && c.affiliations?.length > 0
          ? {
              entityName: c.affiliations[0].affiliation_name,
              entityID: {
                entityID: c.affiliations[0].affiliation_identifier
                  ? extractIdFromUrl(c.affiliations[0].affiliation_identifier)
                  : undefined,
                entityIDSchema: c.affiliations[0].scheme?.toLowerCase(),
              },
            }
          : undefined,
      contributorIDs: c.name_identifiers
        ?.map((i) => ({
          entityID: i.name_identifier ? extractIdFromUrl(i.name_identifier) : undefined,
          entityIDSchema: i.scheme ? i.scheme?.toLowerCase() : i.scheme_uri ? i.scheme_uri?.toLowerCase() : undefined,
        }))
        .filter(
          (a) =>
            (a.entityID?.length == 0 || a.entityID == null) &&
            (a.entityIDSchema == undefined || a.entityIDSchema?.length == 0 || a.entityIDSchema == null),
        ),
      contributorType: validContributorTypes.has(c.contributor_type as ContributorType)
        ? (c.contributor_type as ContributorType)
        : ('Other' as ContributorType),
    };
    return contributor;
  });
  return {
    pids: pids,
    metadata: {
      assetType: 'Dataset',
      alternateIdentifiers: alternateIdentifiers,
      relatedIdentifiers: related_identifiers,
      titles: b2share.metadata.titles.map((t) => ({
        // incorporate title type?
        titleText: t.title,
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
          entityID: extractIdFromUrl(i.name_identifier),
          entityIDSchema: isValidEntityIdSchema(i.scheme)
            ? i.scheme.toLowerCase()
            : i.scheme_uri && isValidEntityIdSchema(i.scheme_uri)
              ? i.scheme_uri.toLowerCase()
              : undefined,
        })),
      })),
      contactPoints:
        b2share.metadata.contact_email
          ?.split(/[;, ]+/)
          .map((e) => {
            return {
              contactEmail: e,
              contactName: '',
            };
          })
          .filter((e) => e.contactEmail !== '') || undefined,
      descriptions: b2share.metadata.descriptions?.map((d) => ({
        descriptionText: d.description,
        descriptionType: d.description_type,
      })),
      keywords: extractB2ShareKeywords(b2share.metadata) || undefined,
      contributors: contributors as Contributor[],
      publicationDate: b2share.metadata.publication_date
        ? formatDateB2Share(b2share.metadata.publication_date)
        : undefined,
      temporalCoverages: b2share.metadata.temporal_coverages?.ranges?.map((t) => ({
        startDate: t.start_date ? formatDateB2Share(t.start_date) : undefined,
        endDate: t.end_date ? formatDateB2Share(t.end_date) : undefined,
      })),
      geoLocations: extractB2ShareGeolocation(b2share.metadata),
      licenses: licenses.length > 0 ? licenses : undefined,
      files: b2share.files?.map((f) => ({
        name: f.key,
        sourceUrl: f.ePIC_PID ? convertHttpToHttps(f.ePIC_PID) : undefined,
        md5: getChecksum(f.checksum),
        size: f.size?.toString(),
        sizeMeasureType: 'kB',
        format: f.key?.split('.').pop(),
      })),
      externalSourceInformation: {
        externalSourceName: repositoryType == 'B2SHARE_EUDAT' ? 'B2Share Eudat' : 'B2Share Juelich',
        externalSourceURI:
          b2share.metadata.ePIC_PID && typeof b2share.metadata.ePIC_PID === 'string' ? b2share.metadata.ePIC_PID : url,
      },
      language:
        typeof b2share.metadata.language === 'string'
          ? b2share.metadata.language
          : b2share.metadata.languages?.map((l) => l.language_name).join() || undefined,
      responsibleOrganizations: [],
      taxonomicCoverages: [],
      methods: [],
      projects:
        repositoryType == 'B2SHARE_EUDAT'
          ? [
              {
                projectName: 'B2SHARE Eudat external record - eLTER Community',
                projectID: 'https://b2share.eudat.eu/communities/LTER',
              },
            ]
          : [
              {
                projectName: 'B2SHARE Juelich external record - eLTER Community',
                projectID: 'https://b2share.fz-juelich.de/communities/LTER',
              },
            ],
      siteReferences: sites,
      habitatReferences: [],
      additionalMetadata: additional_metadata,
    },
  };
}
