import { AlternateIdentifier, CommonDataset, Creator, formatDate, IdentifierType, parsePID } from './commonStructure';

const ZENODO_ASSET_TYPE_MAP = new Map<string, IdentifierType>([
  ['poster', 'Other'],
  ['presentation', 'Other'],
  ['dataset', 'Dataset'],
  ['image', 'Image'],
  ['video', 'Audiovisual'],
  ['software', 'Software'],
  ['lesson', 'Other'],
  ['physicalobject', 'PhysicalObject'],
  ['other', 'Other'],
]);

const ZENODO_PUBLICATION_SUBTYPE_MAP = new Map<string, IdentifierType>([
  ['annotationcollection', 'Collection'],
  ['book', 'Book'],
  ['section', 'BookChapter'],
  ['conferencepaper', 'ConferencePaper'],
  ['datamanagementplan', 'Other'],
  ['article', 'JournalArticle'],
  ['patent', 'Other'],
  ['preprint', 'Preprint'],
  ['deliverable', 'Other'],
  ['milestone', 'Other'],
  ['proposal', 'Other'],
  ['report', 'Report'],
  ['softwaredocumentation', 'Software'],
  ['taxonomictreatment', 'Text'],
  ['technicalnote', 'Other'],
  ['thesis', 'Dissertation'],
  ['workingpaper', 'Other'],
  ['other', 'Other'],
]);

export function getZenodoAssetType(
  zenodoResourceType: { title?: string; type?: string; subtype?: string } | undefined,
): IdentifierType {
  if (!zenodoResourceType || !zenodoResourceType.type) {
    return 'Dataset';
  }

  const resource_type = zenodoResourceType.type.toLowerCase().trim();
  const publicationType = zenodoResourceType.subtype?.toLowerCase().trim();

  if (resource_type === 'publication') {
    const mappedSubtype = ZENODO_PUBLICATION_SUBTYPE_MAP.get(publicationType || '');
    if (!mappedSubtype) {
      process.stderr.write(
        `Publication type ${mappedSubtype} does not have an alternative in Dar. Setting to 'Other'.\n`,
      );
      return 'Other';
    }
    return mappedSubtype;
  }
  const mappedType = ZENODO_ASSET_TYPE_MAP.get(resource_type);
  if (!mappedType) {
    process.stderr.write(
      `Resource type: "${resource_type}" does not have an alternative in Dar. Setting to 'Other'.\n`,
    );
    return 'Other';
  }
  return mappedType;
}

export async function mapZenodoToCommonDatasetMetadata(
  url: string,
  zenodo: any,
  sites: any,
  repositoryType: 'ZENODO' | 'ZENODO_IT',
): Promise<CommonDataset> {
  const alternateIdentifiers: AlternateIdentifier[] = zenodo.metadata.doi
    ? [{ alternateID: zenodo.metadata.doi, alternateIDType: 'DOI' }]
    : [];
  const creators: Creator[] = [];
  zenodo.metadata?.creators.map((creator: any) => {
    let nameParts: string[] = [];
    if (creator.name && typeof creator.name === 'string' && creator.name.includes(',')) {
      nameParts = creator.name.split(',').map((p: string) => p.trim());
    }
    creators.push({
      creatorFamilyName: nameParts.length > 1 ? nameParts[0] : creator.name,
      creatorGivenName: nameParts.length > 1 ? nameParts[1] : '',
      creatorAffiliation: creator.affiliation ? { entityName: creator.affiliation } : undefined,
      creatorIDs: creator.orcid ? [{ entityID: creator.orcid, entityIDSchema: 'orcid' }] : undefined,
    });
  });
  return {
    pids: parsePID(zenodo.metadata.doi) || undefined,
    metadata: {
      assetType: getZenodoAssetType(zenodo.metadata.resource_type),
      alternateIdentifiers: alternateIdentifiers,
      relatedIdentifiers: [],
      titles: [{ titleText: zenodo.metadata?.title || zenodo.title || '' }],
      creators: creators,
      descriptions: [
        {
          descriptionText: zenodo.metadata?.description,
          descriptionType: 'Abstract',
        },
      ],
      keywords: (zenodo.metadata?.keywords || []).map((keyword: string) => ({
        keywordLabel: keyword,
      })),
      publicationDate: formatDate(zenodo.metadata?.publication_date),
      externalSourceInformation: {
        externalSourceName: 'Zenodo',
        externalSourceURI: url,
      },
      projects:
        repositoryType == 'ZENODO'
          ? [
              {
                projectName: 'Zenodo external record - eLTER Community',
                projectID: 'https://zenodo.org/communities/elter',
              },
            ]
          : [
              {
                projectName: 'Zenodo external record - eLTER-Italy Community',
                projectID: 'https://zenodo.org/communities/lter-italy',
              },
            ],

      language: zenodo.metadata?.language || undefined,
    },
  };
}
