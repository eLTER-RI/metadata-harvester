import { CommonDataset } from './commonStructure';

export async function mapZenodoToCommonDatasetMetadata(url: string, zenodo: any, sites: any): Promise<CommonDataset> {
  return {
    metadata: {
      assetType: 'Dataset',
      externalSourceInformation: {
        externalSourceName: 'Zenodo',
        externalSourceURI: url,
      },
    },
  };
}
