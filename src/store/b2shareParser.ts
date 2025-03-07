import { B2ShareExtractedSchema } from './b2shareApi';
import { CommonDatasetMetadata, Creator, extractIdentifiers, SpatialCoverage } from './commonStructure';

function extractSpatialCoverage(input: any): SpatialCoverage[] {
  const coverages: SpatialCoverage[] = input.spatial_coverages?.map((spatCoverage: any) => {
    if (spatCoverage.point) {
      return {
        place: spatCoverage.place,
        type: "point",
        coordinates: [{
          latitude: spatCoverage.point.point_latitude, 
          longitude: spatCoverage.point.point_longitude
        }],
        elevation: null,
        box: null
      };
    }

    if (spatCoverage.box) {
      return {
        place: spatCoverage.place,
        type: "box",
        coordinates: null,
        elevation: null,
        box: {
          west: spatCoverage.box.westbound_longitude,
          east: spatCoverage.box.eastbound_longitude,
          north: spatCoverage.box.northbound_latitude,
          south: spatCoverage.box.southbound_latitude
        }
      };
    }

    if (spatCoverage.polygons && spatCoverage.polygons.length > 0) {
      return {
        place: spatCoverage.place,
        type: "polygon",
        coordinates: spatCoverage.polygons.flatMap((p: any) =>
          p.polygon?.map((p: any) => ({
            latitude: p.point_latitude,
            longitude: p.point_longitude
          })) || []
        ),
        elevation: null,
        box: null
      };
    }

    return {
      place: spatCoverage.place,
      type: "unknown",
      coordinates: null,
      elevation: null,
      box: null
    };
  });
  return coverages || [];
}
  
export const mapB2ShareToCommonDatasetMetadata = (
    b2share: B2ShareExtractedSchema,
  ): CommonDatasetMetadata => {
  const creators: Creator[] | undefined = b2share.creators?.map((c) => ({
    name: c.creator_name
      ? c.creator_name
      : c.given_name || '' + ', ' + c.family_name || '',
    type: 'Person',
  }));

  return {
    // datasetType: "",
    alternateIdentifiers: extractIdentifiers(b2share.metadata) || [],
    relatedIdentifiers: [],
    titles: b2share.titles.map((t) => ({
      titleText: t.title,
      titleType: t.type,
    })),
    creators: creators ? creators : undefined,
    descriptions: b2share.descriptions?.map((d) => ({
      descriptionText: d.description,
      descriptionType: d.description_type,
    })),
    keywords: b2share.keywords?.map((k) => {
      return k.keyword;
    }),
    access: b2share.open_access === undefined ? "unknown" : b2share.open_access ? "open" : "restricted",
    responsibleOrganizations: [],
    contactPoints: [],
    contributors: b2share.contributors?.map((c) => {
      return c.contributor_name;
    }),
    publicationDate: [],
    language: b2share.languages?.map((c) => {
      return c.language_name;
    }),
    temporalCoverages: b2share.temporal_coverages?.ranges?.map((t) => ({
      startDate: t.start_date,
      endDate: t.end_date,
    })),
    spatialCoverages: extractSpatialCoverage(b2share),
    licenses: [],
    temporalResolution: [],
    taxonomicCoverages: [],
    methods: [],
    projects: [],
    siteReferences: [],
    habitatReferences: [],
    dataLevel: '',
    additionalMetadata: [],
  };
};