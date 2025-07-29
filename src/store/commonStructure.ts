// There was already an attempt to create a common schema
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-metadata.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/dataset-type.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-datatypes.yaml?ref_type=heads

import { Metadata } from './b2shareApi';

export type RepositoryType = 'B2SHARE' | 'SITES' | 'B2SHARE_JUELICH';

export type CommonDataset = {
  pids?: PID;
  metadata: CommonDatasetMetadata;
};

export type CommonDatasetMetadata = {
  assetType: string;
  datasetType?: string;
  alternateIdentifiers?: AlternateIdentifier[];
  titles?: Title[];
  creators?: Creator[];
  contactPoints?: Contact[];
  descriptions?: Description[];
  keywords?: Keywords[];
  temporalCoverages?: TemporalCoverage[];
  geoLocations?: Geolocation[];
  licenses?: License[];
  files?: File[];
  responsibleOrganizations?: ResponsibleOrganizations[];
  contributors?: Contributor[];
  publicationDate?: string;
  taxonomicCoverages?: string[];
  methods?: Method[];
  language?: string;
  projects?: Project[];
  siteReferences?: SiteReference[];
  additionalMetadata?: AdditionalMetadata[];
  habitatReferences?: string[];
  relatedIdentifiers?: RelatedIdentifier[];
  dataLevel?: DataLevel;
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

export type Relation =
  | 'IsCitedBy'
  | 'Cites'
  | 'IsSupplementTo'
  | 'IsPublishedIn'
  | 'IsSupplementedBy'
  | 'IsContinuedBy'
  | 'Continues'
  | 'HasMetadata'
  | 'IsMetadataFor'
  | 'IsNewVersionOf'
  | 'IsPreviousVersionOf'
  | 'IsPartOf'
  | 'HasPart'
  | 'IsReferencedBy'
  | 'References'
  | 'IsDocumentedBy'
  | 'Documents'
  | 'isCompiledBy'
  | 'Compiles'
  | 'IsVariantFormOf'
  | 'IsOriginalFormOf'
  | 'IsIdenticalTo'
  | 'IsReviewedBy'
  | 'Reviews'
  | 'IsDerivedFrom'
  | 'IsSourceOf'
  | 'Describes'
  | 'IsDescribedBy'
  | 'HasVersion'
  | 'IsVersionOf'
  | 'Requires'
  | 'IsRequiredBy'
  | 'Obsoletes'
  | 'IsObsoletedBy';

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

const resourceTypesMap = new Map<string, IdentifierType>(
  [
    'Audiovisual',
    'Book',
    'BookChapter',
    'Collection',
    'ComputationalNotebook',
    'ConferencePaper',
    'ConferenceProceeding',
    'DataPaper',
    'Dataset',
    'Dissertation',
    'Event',
    'Image',
    'InteractiveResource',
    'Journal',
    'JournalArticle',
    'Model',
    'OutputManagementPlan',
    'PeerReview',
    'PhysicalObject',
    'Preprint',
    'Report',
    'Service',
    'Software',
    'Sound',
    'Standard',
    'Text',
    'Workflow',
    'Other',
  ].map((type) => [type.toLowerCase(), type as IdentifierType]),
);

export type AlternateIdentifier = {
  alternateID: string;
  alternateIDType: IdentifierType;
};

export type EntityIdentifier = {
  entityID?: string;
  entityIDSchema?: string;
};

export type RelatedIdentifier = {
  relatedID: string;
  relatedIDType: IdentifierType;
  relatedResourceType: IdentifierType;
  relationType: Relation;
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
  organizationIDs?: EntityIdentifier[];
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
  creatorIDs?: EntityIdentifier[];
};

export type ResponsibleOrganizations = {
  organizationName?: string;
  organizationEmail?: string;
  organizationIDs?: EntityIdentifier[];
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
  contributorIDs?: EntityIdentifier[];
  contributorType?: ContributorType;
};

export type Affiliation = {
  entityName?: string;
  entityID?: EntityIdentifier;
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
  sizeMeasureType?: 'GB' | 'MB' | 'kB' | 'B';
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

export type DataLevel = {
  dataLevelCode?: string;
  dataLevelURI?: string;
};

export function extractAlternateIdentifiers(input: Metadata): [AlternateIdentifier[], AdditionalMetadata[]] {
  const additionalMetadata: AdditionalMetadata[] = [];
  const identifiers: AlternateIdentifier[] = [];
  input.alternate_identifiers?.map((item) => {
    if (!item || typeof item.alternate_identifier_type !== 'string' || typeof item.alternate_identifier !== 'string') {
      return null;
    }

    const typeKey = item.alternate_identifier_type.toLowerCase().trim();
    const value = item.alternate_identifier.trim();

    if (!value) {
      return null;
    }

    const idType = identifierTypesMap.get(typeKey) as IdentifierType;
    const idTypeIfReversed = identifierTypesMap.get(value.toLowerCase()) as IdentifierType;
    if (idType) {
      identifiers.push({
        alternateID: value,
        alternateIDType: idType,
      });
    } else if (idTypeIfReversed) {
      identifiers.push({
        alternateID: item.alternate_identifier_type.trim(),
        alternateIDType: idTypeIfReversed,
      });
    } else {
      additionalMetadata.push({
        name: item.alternate_identifier_type.trim(),
        value: value,
      });
    }
  });
  return [identifiers, additionalMetadata];
}

export function extractRelatedIdentifiers(input: Metadata): [RelatedIdentifier[], AdditionalMetadata[]] {
  const additionalMetadata: AdditionalMetadata[] = [];
  const identifiers: RelatedIdentifier[] = [];
  input.related_identifiers?.map((item) => {
    if (!item || typeof item.related_identifier_type !== 'string' || typeof item.related_identifier !== 'string') {
      return null;
    }

    const typeKey = item.related_identifier_type.toLowerCase().trim();
    const value = item.related_identifier.trim();

    if (!value) {
      return null;
    }

    const idType = identifierTypesMap.get(typeKey) as IdentifierType;
    const idTypeIfReversed = identifierTypesMap.get(value.toLowerCase()) as IdentifierType;
    const idTypeResource = resourceTypesMap.get(value.toLowerCase()) as IdentifierType;
    if (idType) {
      identifiers.push({
        relatedID: value,
        relatedIDType: idType,
        relatedResourceType: idTypeResource,
        relationType: item.relation_type,
      });
    } else if (idTypeIfReversed) {
      identifiers.push({
        relatedID: value,
        relatedIDType: idType,
        relatedResourceType: idTypeResource,
        relationType: item.relation_type,
      });
    } else {
      additionalMetadata.push({
        name: item.related_identifier_type.trim(),
        value: value,
      });
    }
  });
  return [identifiers, additionalMetadata];
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

export function toPID(identifiers: AlternateIdentifier[]): PID | undefined {
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

export function normalizeDate(isoString: string) {
  try {
    let normalized: string;

    const match = isoString.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      normalized = `${year}-${month}-${day}`;
    } else {
      normalized = isoString;
    }
    return normalized;
  } catch {
    return undefined;
  }
}

export function formatDate(isoString: string): string | undefined {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new RangeError('Invalid time value');
    }
    return date.toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}
