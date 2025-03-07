import { B2ShareExtractedSchema } from './b2shareApi';
import {
  CompleteDatasetRecord,
  OrganisationRecord,
  PersonRecord,
} from './deimsApi';

// There was already an attempt to create a common schema
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-metadata.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/dataset-type.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-datatypes.yaml?ref_type=heads

export type CommonDatasetMetadata = {
  datasetType?: string;
  alternateIdentifiers?: Identifier[];
  titles?: Title[];
  creators?: Creator[];
  descriptions?: Description[];
  keywords?: string[];
  access: string;
  temporalCoverages?: TemporalCoverage[];
  spatialCoverages?: SpatialCoverage[];
  responsibleOrganizations?: string[];
  contactPoints?: string[];
  contributors?: string[];
  publicationDate?: string[];
  language?: string[];
  licenses?: string[];
  temporalResolution?: string[];
  taxonomicCoverages?: string[];
  methods?: string[];
  projects?: string[];
  siteReferences?: string[];
  habitatReferences?: string[];
  dataLevel?: string;
  additionalMetadata?: string[];
  relatedIdentifiers?: Identifier[];
};

/**
 * The type of the identifier.
 */
export type IdentifierType =
  | 'Audiovisual'
  | 'Book'
  | 'BookChapter'
  | 'Collection'
  | 'ComputationalNotebook'
  | 'ConferencePaper'
  | 'ConferenceProceeding'
  | 'DataPaper'
  | 'Dataset'
  | 'Dissertation'
  | 'Event'
  | 'Image'
  | 'InteractiveResource'
  | 'Journal'
  | 'JournalArticle'
  | 'Model'
  | 'OutputManagementPlan'
  | 'PeerReview'
  | 'PhysicalObject'
  | 'Preprint'
  | 'Report'
  | 'Service'
  | 'Software'
  | 'Sound'
  | 'Standard'
  | 'Text'
  | 'Workflow'
  | 'Other'
  | 'ARK'
  | 'arXiv'
  | 'bibcode'
  | 'DOI'
  | 'EAN13'
  | 'EISSN'
  | 'Handle'
  | 'ISBN'
  | 'ISSN'
  | 'ISTC'
  | 'LISSN'
  | 'LSID'
  | 'ORCID'
  | 'PMID'
  | 'PURL'
  | 'UPC'
  | 'URL'
  | 'URN'
  | 'w3id';

const identifierTypesMap = new Map<string, IdentifierType>(
  [
    'ARK',
    'arXiv',
    'bibcode',
    'DOI',
    'EAN13',
    'EISSN',
    'Handle',
    'ISBN',
    'ISSN',
    'ISTC',
    'LISSN',
    'LSID',
    'ORCID',
    'PMID',
    'PURL',
    'UPC',
    'URL',
    'URN',
    'w3id',
  ].map((type) => [type.toLowerCase(), type as IdentifierType]),
);

export type Identifier = {
  identifier: string;
  identifierType: IdentifierType;
};

export type Title = {
  titleLanguage?: string | undefined;
  titleText: string;
  titleType?: string | undefined;
};

export type Description = {
  descriptionText: string;
  descriptionType?: string | undefined;
};

export type Creator = {
  name?: string;
  type?: 'Person' | 'Organization' | 'Unknown';
  email?: string;
};

export type TemporalCoverage = {
  startDate?: string;
  endDate?: string;
};

export type SpatialCoverage = {
  place?: string;
  type: "point" | "polygon" | "box" | "unknown";
  coordinates?: Coordinates[];
  elevation?: Elevation;
  box?: Box[];
};

export type Coordinates = {
  latitude?: number;
  longitude?: number;
};

export type Elevation = {
  min?: number;
  max?: number;
  avg?: number;
  unit?: string;
};

export type Box = {
  west?: number;
  east?: number;
  north?: number;
  south?: number;
};


// eslint-disable-next-line
function extractIdentifiers(input: any): Identifier[] {
  return Object.entries(input || {})
    .filter(([key]) => identifierTypesMap.has(key.toLowerCase()))
    .map(([key, value]) => ({
      identifier: value as string,
      identifierType: identifierTypesMap.get(
        key.toLowerCase(),
      ) as IdentifierType,
    }));
}

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

function parseDeimsCreator(c: PersonRecord | OrganisationRecord): Creator {
  if (c.type === 'person') {
    const creator: PersonRecord = c as PersonRecord;
    return {
      type: 'Person',
      name: creator.name,
      email: creator.email,
    };
  } else if (c.type === 'organisation') {
    const creator: OrganisationRecord = c as OrganisationRecord;
    return {
      type: 'Organization',
      name: creator.name,
    };
  } else {
    return {
      type: 'Unknown',
      name: c.name,
    };
  }
}

export const mapDeimsToCommonDatasetMetadata = (
  deims: CompleteDatasetRecord,
): CommonDatasetMetadata => {
  const descriptions: Description[] = [];
  if (deims.attributes?.general?.abstract) {
    descriptions.push({
      descriptionText: deims.attributes?.general?.abstract,
      descriptionType: 'Abstract',
    });
  }
  if (deims.attributes?.method) {
    descriptions.push({
      descriptionText: deims.attributes?.method?.toString(),
      descriptionType: 'Methods',
    });
  }

  return {
    alternateIdentifiers: extractIdentifiers(
      deims.attributes?.onlineDistribution,
    ),
    relatedIdentifiers: [],
    titles: [
      {
        titleText: deims.title || '',
        titleLanguage: deims.attributes?.general?.language,
      },
    ],
    creators:
      deims.attributes?.contact?.creator?.map((c) => parseDeimsCreator(c)) ||
      deims.attributes?.contact?.corresponding?.map((c) =>
        parseDeimsCreator(c),
      ) ||
      [],
    descriptions: descriptions,
    keywords: deims.attributes?.general?.keywords
      ?.filter((k) => k && k.label)
      .map((k) => k.label as string),
    access: deims.attributes?.legal?.accessUse?.map((entry: any) => entry.label).join("; ") || "unknown",
    temporalCoverages: [{
      startDate: deims.attributes?.general?.dateRange?.from,
      endDate: deims.attributes?.general?.dateRange?.to,
    }],
    // spatialCoverages: deims.attributes?.geographic?.map((g) => ({
    //   coordinates: {
    //     latitude: s.boundaries?.,
    //     longitude: s.point?.point_longitude,
    //   },
    //   place: s.place,
    // })),
    responsibleOrganizations: [],
    contactPoints: [],
    contributors: [],
    publicationDate: [],
    language: deims.attributes?.general?.language
      ? [deims.attributes?.general?.language]
      : [],
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
