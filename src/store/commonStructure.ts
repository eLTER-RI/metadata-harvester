// There was already an attempt to create a common schema
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-metadata.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/dataset-type.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-datatypes.yaml?ref_type=heads

export type CommonDatasetMetadata = {
  datasetType?: string;
  alternateIdentifiers?: Identifier[];
  titles?: Title[];
  creators?: Creator[];
  contactPoints?: Contact[];
  descriptions?: Description[];
  keywords?: Keywords[];
  temporalCoverages?: TemporalCoverage[];
  geolocation?: Geolocation[];
  licenses?: License[];
  languages?: string[];
  files?: File[];
  responsibleOrganizations?: string[];
  contributors?: Contributor[];
  publicationDate?: string;
  temporalResolution?: string[];
  taxonomicCoverages?: string[];
  methods?: string[];
  projects?: string[];
  siteReferences?: string[];
  habitatReferences?: string[];
  dataLevel?: string;
  additionalMetadata?: string[];
  relatedIdentifiers?: Identifier[];
  externalSourceInformation: ExternalSource;
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
  alternateID: string;
  alternateIDType: IdentifierType;
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

export type Keywords = {
  keywordLabel: string;
  keywordURI?: string;
};

export type Contact = {
  contactName?: string;
  contactEmail?: string;
};

export type Organization = {
  organizationName?: string;
  organizationEmail?: string;
  organizationIDs?: {
    entityID?: string;
    entityIDSchema?: string;
  }[];
};

export type ExternalSource = {
  externalSourceName?: string;
  externalSourceURI?: string;
  externalSourceInfo?: string;
};

export type Creator = {
  creatorFamilyName?: string;
  creatorGivenName?: string;
  creatorEmail?: string;
  creatorAffiliation?: Affiliation;
  creatorIDs?: {
    entityID?: string;
    entityIDSchema?: string;
  }[];
};

export type Contributor = {
  contributorFamilyName?: string;
  contributorGivenName?: string;
  contributorEmail?: string;
  contributorAffiliation?: Affiliation;
  contributorIDs?: {
    entityID?: string;
    entityIDSchema?: string;
  }[];
  contributorType?: string;
};

export type Affiliation = {
  entityName?: string;
  entityID?: {
    entityID?: string;
    entityIDSchema?: string;
  }
};

export type TemporalCoverage = {
  startDate?: string;
  endDate?: string;
};

export type Geolocation = {
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

export type License = {
  licenseCode?: string;
  licenseURI?: string;
};

export type File = {
  name?: string;
  sourceUrl?: string;
  format?: string;
  md5?: string;
  size?: string;
  sizeMeasureType?: "GB" | "MB" | "kB";
};

// eslint-disable-next-line
export function extractIdentifiers(input: any): Identifier[] {
  return Object.entries(input || {})
    .filter(([key]) => identifierTypesMap.has(key.toLowerCase()))
    .map(([key, value]) => ({
      alternateID: value as string,
      alternateIDType: identifierTypesMap.get(
        key.toLowerCase(),
      ) as IdentifierType,
    }));
}
