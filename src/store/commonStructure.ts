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
  responsibleOrganizations?: string[];
  contactPoints?: string[];
  contributors?: string[];
  publicationDate?: string[];
  language?: string[];
  keywords?: string[];
  licenses?: string[];
  geoLocations?: string[];
  temporalCoverages?: string[];
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
    responsibleOrganizations: [],
    contactPoints: [],
    contributors: b2share.contributors?.map((c) => {
      return c.contributor_name;
    }),
    publicationDate: [],
    language: b2share.languages?.map((c) => {
      return c.language_name;
    }),
    keywords: [],
    licenses: [],
    geoLocations: [],
    temporalCoverages: [],
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
    responsibleOrganizations: [],
    contactPoints: [],
    contributors: [],
    publicationDate: [],
    language: deims.attributes?.general?.language
      ? [deims.attributes?.general?.language]
      : [],
    keywords: [],
    licenses: [],
    geoLocations: [],
    temporalCoverages: [],
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
