import { B2ShareExtractedSchema, RelatedIdentifiers, Type1, Type2, Type3, Type4 } from "./b2shareApi";
import { CompleteDatasetRecord, OrganisationRecord, PersonRecord } from "./deimsApi";

// There was already an attempt to create a common schema
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-metadata.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/dataset-type.yaml?ref_type=heads
// https://gitlab.ics.muni.cz/dataraptors/elter/elter-invenio/-/blob/master/models/datasets-datatypes.yaml?ref_type=heads

export type CommonDatasetMetadata = {
    datasetType?: string;
    alternateIdentifiers?: AlternateIdentifier[]; 
    relatedIdentifiers?: RelatedIdentifiers[];
    titles?: Title[];
    creators?: Creator[];
    responsibleOrganizations?: string[];
    contactPoints?:  string[];
    contributors?: string[];
    publicationDate?: string[];
    language?: string[];
    descriptions?: string[];
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
}

/**
 * The type of the identifier.
 */
export type AlternateIdentifierType = Type2 | Type3 | Type4

export type AlternateIdentifier = {
  alternateIdentifier: string;
  alternateIdentifier_type: AlternateIdentifierType;
}[];

export type RelatedIdentifier = Type1;

export type Title = {
    titleLanguage?: string | undefined;
    titleText: string;
    titleType?: string | undefined;
}

export type Creator = {
  name?: string;
  type?: "Person" | "Organization" | "Unknown";  
  email?: string;
}

export const mapB2ShareToCommonDatasetMetadata = (
  b2share: B2ShareExtractedSchema
): CommonDatasetMetadata => {
  const creators: Creator[] | undefined = b2share.creators?.map((c) => ({
    name: c.creator_name ? c.creator_name : c.given_name || "" + ", " + c.family_name || "",
    type: "Person",
  }));
  
  return {
    // datasetType: "",
    alternateIdentifiers: [],
    relatedIdentifiers: [],
    titles: b2share.titles.map((t) => ({
      titleText: t.title,
      titleType: t.type,
    })),
    creators: creators ? creators : undefined,
    responsibleOrganizations: [],
    contactPoints:  [],
    contributors: b2share.contributors?.map((c) => {
      return c.contributor_name;
    }),
    publicationDate: [],
    language: b2share.languages?.map((c) => {
      return c.language_name;
    }),
    descriptions: [],
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
    dataLevel: "",
    additionalMetadata: []
  }
}

function parseDeimsCreator(c: PersonRecord | OrganisationRecord): Creator {
  if (c.type === "person") {
    const creator: PersonRecord = c as PersonRecord
    return {
      type: "Person",
      name: creator.name,
      email: creator.email,
    };
  } else if (c.type === "organisation"){
    const creator: OrganisationRecord = c as OrganisationRecord
    return {
      type: "Organization",
      name: creator.name,
    };
  } else {
    return {
      type: "Unknown",
      name: c.name,
    }
  }
}

export const mapDeimsToCommonDatasetMetadata = (
  deims: CompleteDatasetRecord
): CommonDatasetMetadata => {
  return {
    alternateIdentifiers: [],
    relatedIdentifiers: [],
    titles: [
      {
        titleText: deims.title || "",
        titleLanguage: deims.attributes?.general?.language,
      },
    ],
    creators: deims.attributes?.contact?.creator?.map((c) => parseDeimsCreator(c)) ||
    deims.attributes?.contact?.corresponding?.map((c) => parseDeimsCreator(c)) || [],  
    responsibleOrganizations: [],
    contactPoints:  [],
    contributors: [],
    publicationDate: [],
    language: deims.attributes?.general?.language ? [deims.attributes?.general?.language] : [],
    descriptions: [],
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
    dataLevel: "",
    additionalMetadata: []
  }
}
