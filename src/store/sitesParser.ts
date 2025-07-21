import { License, CommonDataset } from './commonStructure';

export async function mapFieldSitesToCommonDatasetMetadata(
  url: string,
  fieldSites: any,
  sites: any,
): Promise<CommonDataset> {
  const licenses: License[] = [];
  if (fieldSites.references?.licence) {
    licenses.push({
      licenseCode: fieldSites.references.licence.name,
      licenseURI: fieldSites.references.licence.url,
    });
  }

  return {
    metadata: {
      assetType: 'Dataset',
      externalSourceInformation: {
        externalSourceName: 'fieldsites',
        externalSourceURI: url,
      },
      titles: [
        {
          titleText: fieldSites.references.title,
        },
      ],
      licenses: licenses,
      siteReferences: sites,
    },
  };
}
