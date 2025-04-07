import { B2ShareExtractedSchema } from './b2shareApi';
import {
  CommonDatasetMetadata,
  extractIdentifiers,
  Geolocation,
  License
} from './commonStructure';

// eslint-disable-next-line
function extractB2ShareGeolocation(input: any): Geolocation[] {
  const coverages: Geolocation[] = []
  input.spatial_coverages?.map(
    // eslint-disable-next-line
    (spatCoverage: any) => {
      if (spatCoverage.point) {
        coverages.push({
          geographicDescription: spatCoverage.place,
          point: {
              latitude: spatCoverage.point.point_latitude,
              longitude: spatCoverage.point.point_longitude,
            }
        });
      };

      if (spatCoverage.box) {
        coverages.push({
          geographicDescription: spatCoverage.place ?? "",
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
            points: polygon.polygon?.map((point: any) => ({
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

function formatDate(isoString: string) {
  return new Date(isoString).toISOString().split('T')[0];
}

export const mapB2ShareToCommonDatasetMetadata = (
  url: string,
  b2share: B2ShareExtractedSchema,
): CommonDatasetMetadata => {
  const licenses: License[] = []
  if (b2share.metadata.license) {
    licenses.push({
      licenseCode: b2share.metadata.license.license_identifier,
      licenseURI: b2share.metadata.license.license_uri,
    })
  }

  if (b2share.metadata.license) {
    licenses.push({
      licenseCode: b2share.metadata.license.license_identifier,
      licenseURI: b2share.metadata.license.license_uri,
    })

  }
  return {
    assetType: "Dataset",
    alternateIdentifiers: extractIdentifiers(b2share.metadata) || [],
    relatedIdentifiers: [],
    titles: b2share.metadata.titles.map((t) => ({
      titleText: t.title,
      titleType: t.type,
      titleLanguage: "",
    })),
    creators: b2share.metadata.creators?.map((c) => ({
      creatorFamilyName: c.family_name ?? c.creator_name,
      creatorGivenName: c.given_name,
      creatorEmail: "",
      creatorAffiliation: c.affiliations?.length != undefined && c.affiliations?.length > 0 ? ({
        entityName: c.affiliations[0].affiliation_name,
        entityID: {
          entityID: c.affiliations[0].affiliation_identifier,
          entityIDSchema: c.affiliations[0].scheme?.toLowerCase(),
        },
      }) : undefined,
      creatorIDs: c.name_identifiers?.map((i) => ({
        entityID: i.name_identifier,
        entityIDSchema: i.scheme ? i.scheme.toLowerCase() : i.scheme_uri?.toLowerCase(),
      })),
    })),
    contactPoints: b2share.metadata.contact_email ? [{
      contactEmail: b2share.metadata.contact_email,
      contactName: "",
    }] : undefined,
    descriptions: b2share.metadata.descriptions?.map((d) => ({
      descriptionText: d.description,
      descriptionType: d.description_type,
    })),
    keywords: b2share.metadata.keywords?.map((k) => {
      if (typeof k === "string") {
        return { keywordLabel: k };
      }
      return {
        keywordLabel: k.keyword,
        keywordURI: k.scheme_uri,
      };
    }) || undefined,
    contributors: b2share.metadata.contributors?.map((c) => ({
      contributorFamilyName: c.family_name ?? c.contributor_name,
      contributorGivenName: c.given_name,
      contributorAffiliation: c.affiliations?.length != undefined && c.affiliations?.length > 0 ? ({
        entityName: c.affiliations[0].affiliation_name,
        entityID: {
          entityID: c.affiliations[0].affiliation_identifier,
          entityIDSchema: c.affiliations[0].scheme?.toLowerCase(),
        },
      }) : undefined,
      contributorIDs: c.name_identifiers?.map((i) => ({
        entityID: i.name_identifier,
        entityIDSchema: i.scheme ? i.scheme?.toLowerCase() : i.scheme_uri?.toLowerCase(),
      })),
      contributorType: c.contributor_type,
    })),
    publicationDate: b2share.metadata.publication_date ? formatDate(b2share.metadata.publication_date) : undefined,
    temporalCoverages: b2share.metadata.temporal_coverages?.ranges?.map((t) => ({
      startDate: t.start_date,
      endDate: t.end_date,
    })),
    geoLocations: extractB2ShareGeolocation(b2share.metadata),
    licenses: licenses.length > 0 ? licenses : undefined,
    files: b2share.files?.map((f) => ({
      name: f.key,
      sourceUrl: b2share.links.files,
      md5: f.checksum?.split(":").pop(),
      size: f.size?.toString(),
      sizeMeasureType: "kB",
      format: f.key?.split(".").pop(),
    })),
    externalSourceInformation: {
      externalSourceName: "b2share",
      externalSourceURI: url,
    },
    responsibleOrganizations: [],
    taxonomicCoverages: [],
    methods: [],
    projects: [],
    siteReferences: [],
    habitatReferences: [],
    additionalMetadata: [],
  };
};

// TODO: figure out methods - in b2share as a part of descriptions