import { AlternateIdentifier, CommonDataset, parsePID } from './commonStructure';

export async function mapZenodoToCommonDatasetMetadata(
  url: string,
  zenodo: any,
  sites: any,
  repositoryType: 'ZENODO' | 'ZENODO_IT',
): Promise<CommonDataset> {
  const alternateIdentifiers: AlternateIdentifier[] = zenodo.metadata.doi
    ? [{ alternateID: zenodo.metadata.doi, alternateIDType: 'DOI' }]
    : [];
  return {
    pids: parsePID(zenodo.metadata.doi) || undefined,
    metadata: {
      assetType: zenodo.metadata.resource_type || 'Dataset',
      alternateIdentifiers: alternateIdentifiers,
      externalSourceInformation: {
        externalSourceName: 'Zenodo',
        externalSourceURI: url,
      },
      relatedIdentifiers: [],
      titles: zenodo.metadata?.title || zenodo.title,
      language: zenodo.metadata?.language || undefined,
    },
  };
}
