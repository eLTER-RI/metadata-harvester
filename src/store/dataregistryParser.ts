import { CommonDataset, getLicenseURI, License } from './commonStructure';

export async function mapDataRegistryToCommonDatasetMetadata(
  url: string,
  dataRegistry: any,
  sites: any,
): Promise<CommonDataset> {
  const licenses: License[] = [];
  if (dataRegistry?.license) {
    licenses.push({
      licenseCode: dataRegistry.license.identifier,
      licenseURI: getLicenseURI(dataRegistry.license.identifier.toLowerCase()),
    });
  }

  return {
    metadata: {
      assetType: dataRegistry.resource_type === 'dataset' ? 'Dataset' : 'Other',
      titles: [
        {
          titleText: dataRegistry.title,
        },
      ],
      licenses: licenses.length > 0 ? licenses : undefined,
      externalSourceInformation: {
        externalSourceName: 'LTER-Italy',
        externalSourceURI: url,
      },
      siteReferences: sites,
    },
  };
}
