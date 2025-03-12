import { B2ShareExtractedSchema } from './b2shareApi';
import {
  CommonDatasetMetadata,
  Contact,
  extractIdentifiers,
  SpatialCoverage,
} from './commonStructure';

// eslint-disable-next-line
function extractB2ShareSpatialCoverage(input: any): SpatialCoverage[] {
  const coverages: SpatialCoverage[] = input.spatial_coverages?.map(
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

const addB2ShareEmailForCreator = (email: string, creator: any): string | undefined => {
  if (!creator.family_name) { return undefined };
  const familyName: string = creator.family_name?.toLowerCase();
  const givenNames: string[] = creator.given_name?.toLowerCase().split(/[\s,]+/) ?? [];  
  const fullNameMatch = givenNames.some((given) =>
    email.includes(given) && email.includes(familyName)
  );

  return fullNameMatch ? email : undefined;
}

export const mapB2ShareToCommonDatasetMetadata = (
  b2share: B2ShareExtractedSchema,
): CommonDatasetMetadata => {
  const normalizedEmail = b2share.metadata.contact_email?.toLowerCase() ?? '';
  const creators: Contact[] | undefined = b2share.metadata.creators?.map((c) => {
    const name = c.creator_name ??
      (c.given_name || '' + ', ' + c.family_name || '');
    let email: string | undefined;
   
    return {
      name,
      type: 'Person',
      email: addB2ShareEmailForCreator(normalizedEmail, c),
    }
  });

  return {
    // datasetType: "",
    alternateIdentifiers: extractIdentifiers(b2share.metadata) || [],
    relatedIdentifiers: [],
    titles: b2share.metadata.titles.map((t) => ({
      titleText: t.title,
      titleType: t.type,
    })),
    creators: creators ? creators : undefined,
    contact: b2share.metadata.contact_email ? [{
      email: b2share.metadata.contact_email,
    }] : undefined,
    descriptions: b2share.metadata.descriptions?.map((d) => ({
      descriptionText: d.description,
      descriptionType: d.description_type,
    })),
    keywords: b2share.metadata.keywords?.map((k) => {
      return k.keyword;
    }),
    access:
      b2share.metadata.open_access === undefined
        ? 'unknown'
        : b2share.metadata.open_access
          ? 'open'
          : 'restricted',
    contactPoints: [],
    contributors: b2share.metadata.contributors?.map((c) => {
      return c.contributor_name;
    }),
    publicationDate: [],
    languages: b2share.metadata.languages?.map((c) => {
      return c.language_name;
    }),
    temporalCoverages: b2share.metadata.temporal_coverages?.ranges?.map((t) => ({
      startDate: t.start_date,
      endDate: t.end_date,
    })),
    spatialCoverages: extractB2ShareSpatialCoverage(b2share),
    licenses: b2share.metadata.license ? [{
      id: b2share.metadata.license.license_identifier,
      url: b2share.metadata.license.license_uri,
    }] : undefined,
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
