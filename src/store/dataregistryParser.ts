import { B2ShareExtractedSchema } from './b2shareApi';
import { CommonDataset } from './commonStructure';

export async function mapDataRegistryToCommonDatasetMetadata(
  url: string,
  dataRegistry: any,
  sites: any,
): Promise<CommonDataset> {
  return {
    metadata: {
      assetType: dataRegistry?.resource_type === 'dataset' ? 'Dataset' : 'Other',
      externalSourceInformation: {
        externalSourceName: 'LTER-Italy',
        externalSourceURI: url,
      },
      siteReferences: sites,
    },
  };
}
