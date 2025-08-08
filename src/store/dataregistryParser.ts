import { CommonDataset, Contact, Creator, getLicenseURI, License } from './commonStructure';

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

  const creators: Creator[] = [];
  const contactPoints: Contact[] = [];
  const owner = dataRegistry.resource.owner;
  if (owner) {
    creators.push({
      creatorFamilyName: owner.last_name,
      creatorGivenName: owner.first_name,
      creatorEmail: owner.email,
    });
    contactPoints.push({
      contactName: `${owner.first_name} ${owner.last_name}`,
      contactEmail: owner.email,
    });
  }

  dataRegistry.resource.poc.forEach((contact: any) => {
    if (owner && contact.last_name === owner.last_name && contact.first_name === owner.first_name)
      contactPoints.push({
        contactName: contact.first_name + ' ' + contact.last_name,
        contactEmail: contact.email,
      });
  });

  return {
    metadata: {
      assetType: dataRegistry.resource.resource_type === 'dataset' ? 'Dataset' : 'Other',
      titles: [
        {
          titleText: dataRegistry.resource.title,
        },
      ],
      creators: creators,
      contactPoints: contactPoints,
      descriptions: dataRegistry.resource.abstract
        ? [
            {
              descriptionText: dataRegistry.resource.abstract,
              descriptionType: 'Abstract',
            },
          ]
        : [],
      licenses: licenses.length > 0 ? licenses : undefined,
      files: dataRegistry.resource.download_urls?.map((downloadUrl: any) => ({
        name: dataRegistry.resource.title,
        sourceUrl: downloadUrl.url,
        format: dataRegistry.resource.title.split('.').pop(),
      })),
      externalSourceInformation: {
        externalSourceName: 'DataRegistry',
        externalSourceURI: url,
      },
      siteReferences: sites,
      language: dataRegistry.resource.language ?? undefined,
    },
  };
}
