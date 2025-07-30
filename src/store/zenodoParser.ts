import { AlternateIdentifier, CommonDataset, Creator, parsePID } from './commonStructure';

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
      assetType: zenodo.metadata.resource_type.title || 'Dataset',
      alternateIdentifiers: alternateIdentifiers,
      relatedIdentifiers: [],
      titles: [{ titleText: zenodo.metadata?.title || zenodo.title || '' }],
      creators: creators,
      externalSourceInformation: {
        externalSourceName: 'Zenodo',
        externalSourceURI: url,
      },
      language: zenodo.metadata?.language || undefined,
    },
  };
}
