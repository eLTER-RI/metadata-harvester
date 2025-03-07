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
  type: 'point' | 'polygon' | 'multipolygon' | 'box' | 'unknown';
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
export function extractIdentifiers(input: any): Identifier[] {
  return Object.entries(input || {})
    .filter(([key]) => identifierTypesMap.has(key.toLowerCase()))
    .map(([key, value]) => ({
      identifier: value as string,
      identifierType: identifierTypesMap.get(
        key.toLowerCase(),
      ) as IdentifierType,
    }));
}
