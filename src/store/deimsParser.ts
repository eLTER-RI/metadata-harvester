import { CommonDatasetMetadata, Creator, Description, extractIdentifiers } from './commonStructure';
import {
  CompleteDatasetRecord,
  OrganisationRecord,
  PersonRecord,
} from './deimsApi';

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
