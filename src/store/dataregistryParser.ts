import { B2ShareExtractedSchema } from './b2shareApi';
import { CommonDataset } from './commonStructure';

export async function mapDataRegistryToCommonDatasetMetadata(
  url: string,
  dataRegistry: B2ShareExtractedSchema,
  sites: any,
): Promise<CommonDataset> {
  return {
    metadata: {
      assetType: 'Dataset',
      externalSourceInformation: {
        externalSourceName: 'LTER-Italy',
        externalSourceURI: url,
      },
      siteReferences: sites,
    },
  };
}
