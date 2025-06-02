// There was already an attempt to create a common schema
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-metadata.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/dataset-type.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-datatypes.yaml?ref_type=heads

export type CommonDataset = {
  pids?: PID;
  metadata: CommonDatasetMetadata;
};

export type CommonDatasetMetadata = {
  assetType: string;
  datasetType?: string;
  alternateIdentifiers?: Identifier[];
  titles?: Title[];
  creators?: Creator[];
  contactPoints?: Contact[];
  descriptions?: Description[];
  keywords?: Keywords[];
  temporalCoverages?: TemporalCoverage[];
  geoLocations?: Geolocation[];
  licenses?: License[];
  files?: File[];
  responsibleOrganizations?: string[];
  contributors?: Contributor[];
  publicationDate?: string;
  taxonomicCoverages?: string[];
  methods?: Method[];
  language?: string;
  projects?: Project[];
  siteReferences?: SiteReference[];
  additionalMetadata?: AdditionalMetadata[];
  habitatReferences?: string[];
  relatedIdentifiers?: Identifier[];
  externalSourceInformation: ExternalSource;
};

export type DOI = {
  identifier: string;
  provider: string;
};

export type PID = {
  doi: DOI;
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

const validContributorTypeArray = [
  'ContactPerson',
  'DataCollector',
  'DataCurator',
  'DataManager',
  'MetadataProvider',
  'Producer',
  'ProjectLeader',
  'ProjectManager',
  'ProjectMember',
  'RegistrationAuthority',
  'RelatedPerson',
  'Researcher',
  'ResearchGroup',
  'Other',
] as const;

const validEntityIdSchemas = new Set<string>(['ror', 'orcid', 'wos', 'scopus']);

export type ContributorType = (typeof validContributorTypeArray)[number];

export const validContributorTypes: Set<ContributorType> = new Set(validContributorTypeArray);

export type Contributor = {
  contributorFamilyName?: string;
  contributorGivenName?: string;
  contributorEmail?: string;
  contributorAffiliation?: Affiliation;
  contributorIDs?: {
    entityID?: string;
    entityIDSchema?: string;
  }[];
  contributorType?: ContributorType;
};

export type Affiliation = {
  entityName?: string;
  entityID?: {
    entityID?: string;
    entityIDSchema?: string;
  };
};

export type TemporalCoverage = {
  startDate?: string;
  endDate?: string;
};

export type Geolocation = {
  observationLocation?: ObservationLocation;
  geographicDescription?: string;
  boundingBox?: BoundingBox;
  boundingPolygon?: {
    points: Coordinates[];
    inPolygonPoint: Coordinates;
  }[];
  point?: Coordinates;
};

export type Coordinates = {
  latitude?: number;
  longitude?: number;
};

export type ObservationLocation = {
  deimsLocationID: string;
  deimsLocationName: string;
};

export type BoundingBox = {
  westBoundLongitude: number;
  eastBoundLongitude: number;
  southBoundLatitude: number;
  northBoundLatitude: number;
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
  sizeMeasureType?: 'GB' | 'MB' | 'kB';
};

export type Method = {
  methodID?: string;
  steps?: Steps[];
  sampling?: Sampling;
  qualityControlDescription?: string;
  instrumentationDescription?: string;
};

export type Project = {
  projectName?: string;
  projectID?: string;
};

export type Sampling = {
  studyDescription?: string;
  samplingDescription?: string;
};

export type Steps = {
  stepTitle?: string;
  stepDescription?: string;
};

export type SiteReference = {
  siteID?: string;
  siteName?: string;
};

export type AdditionalMetadata = {
  name: string;
  value: string;
};

// eslint-disable-next-line
export function extractIdentifiers(input: any): Identifier[] {
  return Object.entries(input || {})
    .filter(([key]) => identifierTypesMap.has(key.toLowerCase()))
    .map(([key, value]) => ({
      alternateID: value as string,
      alternateIDType: identifierTypesMap.get(key.toLowerCase()) as IdentifierType,
    }));
}

export function parseDOIUrl(url: string): DOI | null {
  const match = url.match(/^https?:\/\/([^/]+)\/(.+)$/i);
  if (!match) return null;

  return {
    provider: match[1],
    identifier: match[2],
  };
}

export function parsePID(url: string): PID | null {
  const match = url.match(/^https?:\/\/([^/]+)\/(.+)$/i);
  if (!match) return null;

  return {
    doi: {
      provider: match[1],
      identifier: match[2],
    },
  };
}

export function toPID(identifiers: Identifier[]): PID | undefined {
  const doiEntry = identifiers.find((id) => id.alternateIDType.toLowerCase() === 'doi');
  if (!doiEntry) return undefined;

  const parsed = parseDOIUrl(doiEntry.alternateID);
  if (!parsed) return undefined;

  return {
    doi: {
      identifier: parsed.identifier,
      provider: parsed.provider,
    },
  };
}

export function isValidEntityIdSchema(schema: string | undefined): boolean {
  if (!schema) {
    return false;
  }
  return validEntityIdSchemas.has(schema.toLowerCase());
}
