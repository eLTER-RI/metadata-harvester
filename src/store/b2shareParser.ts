import { B2ShareExtractedSchema } from './b2shareApi';
import {
  CommonDatasetMetadata,
  Contact,
  extractIdentifiers,
  Geolocation,
} from './commonStructure';

// eslint-disable-next-line
function extractB2ShareSpatialCoverage(input: any): Geolocation[] {
  const coverages: Geolocation[] = input.spatial_coverages?.map(
    // eslint-disable-next-line
    (spatCoverage: any) => {
      if (spatCoverage.point) {
        return {
          place: spatCoverage.place,
          type: 'point',
          coordinates: [
            {
              latitude: spatCoverage.point.point_latitude,
              longitude: spatCoverage.point.point_longitude,
            },
          ],
          elevation: null,
          box: null,
        };
      }

      if (spatCoverage.box) {
        return {
          place: spatCoverage.place,
          type: 'box',
          coordinates: null,
          elevation: null,
          box: {
            west: spatCoverage.box.westbound_longitude,
            east: spatCoverage.box.eastbound_longitude,
            north: spatCoverage.box.northbound_latitude,
            south: spatCoverage.box.southbound_latitude,
          },
        };
      }

      if (spatCoverage.polygons && spatCoverage.polygons.length > 0) {
        return {
          place: spatCoverage.place,
          type: 'polygon',
          coordinates: spatCoverage.polygons.flatMap(
            // eslint-disable-next-line
            (p: any) =>
              // eslint-disable-next-line
              p.polygon?.map((p: any) => ({
                latitude: p.point_latitude,
                longitude: p.point_longitude,
              })) || [],
          ),
          elevation: null,
          box: null,
        };
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

export const mapB2ShareToCommonDatasetMetadata = (
  url: string,
  b2share: B2ShareExtractedSchema,
): CommonDatasetMetadata => {
  const normalizedEmail = b2share.metadata.contact_email?.toLowerCase() ?? '';

  return {
    source: url,
    alternateIdentifiers: extractIdentifiers(b2share.metadata) || [],
    relatedIdentifiers: [],
    titles: b2share.metadata.titles.map((t) => ({
      titleText: t.title,
      titleType: t.type,
    })),
    creators: b2share.metadata.creators?.map((c) => ({
      creatorFamilyName: c.family_name ?? c.creator_name,
      creatorGivenName: c.given_name,
      creatorEmail: "",
      creatorAffiliation: c.affiliations?.length != undefined && c.affiliations?.length > 0 ? ({
        entityName: c.affiliations[0].affiliation_name,
        entityID: {
          entityID: c.affiliations[0].affiliation_identifier,
          entityIDSchema: c.affiliations[0].scheme,
        },
      }) : undefined,
      creatorIDs: c.name_identifiers?.map((i) => ({
        entityID: i.name_identifier,
        entityIDSchema: i.scheme ?? i.scheme_uri,
      })),
    })),
    contact: b2share.metadata.contact_email ? [{
      email: b2share.metadata.contact_email,
    }] : undefined,
    descriptions: b2share.metadata.descriptions?.map((d) => ({
      descriptionText: d.description,
      descriptionType: d.description_type,
    })),
    keywords: b2share.metadata.keywords?.map((k) => ({
      keywordLabel: k.keyword,
      keywordURI: k.scheme_uri,
    })),
    access:
      b2share.metadata.open_access === undefined
        ? 'unknown'
        : b2share.metadata.open_access
          ? 'open'
          : 'restricted',
    contactPoints: [],
    contributors: b2share.metadata.contributors?.map((c) => ({
      contributorFamilyName: c.family_name ?? c.contributor_name,
      contributorGivenName: c.given_name,
      contributorAffiliation: c.affiliations?.length != undefined && c.affiliations?.length > 0 ? ({
        entityName: c.affiliations[0].affiliation_name,
        entityID: {
          entityID: c.affiliations[0].affiliation_identifier,
          entityIDSchema: c.affiliations[0].scheme,
        },
      }) : undefined,
      contributorIDs: c.name_identifiers?.map((i) => ({
        entityID: i.name_identifier,
        entityIDSchema: i.scheme ?? i.scheme_uri,
      })),
      contributorType: c.contributor_type,
    })),
    publicationDate: b2share.metadata.publication_date,
    languages: b2share.metadata.languages?.map((c) => {
      return c.language_name;
    }),
    temporalCoverages: b2share.metadata.temporal_coverages?.ranges?.map((t) => ({
      startDate: t.start_date,
      endDate: t.end_date,
    })),
    geolocation: extractB2ShareSpatialCoverage(b2share),
    licenses: b2share.metadata.license ? [{
      licenseCode: b2share.metadata.license.license_identifier,
      licenseURI: b2share.metadata.license.license_uri,
    }] : undefined,
    files: b2share.files?.map((f) => ({
      name: f.key,
      sourceUrl: b2share.links.files,
      md5: f.checksum?.split(":").pop(),
      size: f.size?.toString(),
      sizeMeasureType: "kB",
      format: f.key?.split(".").pop(),
    })),
    temporalResolution: [],
    taxonomicCoverages: [],
    methods: [],
    responsibleOrganizations: [],
    projects: [],
    siteReferences: [],
    habitatReferences: [],
    dataLevel: '',
    additionalMetadata: [],
  };
};
