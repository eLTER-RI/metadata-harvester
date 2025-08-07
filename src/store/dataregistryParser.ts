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
  if (dataRegistry.owner) {
    const owner = dataRegistry.owner;
    creators.push({
      creatorFamilyName: owner.last_name,
      creatorGivenName: owner.first_name,
      creatorEmail: owner.email,
      creatorIDs: [
        {
          entityID: owner.pk,
          entityIDSchema: 'dataregistry primary key',
        },
      ],
    });
    contactPoints.push({
      contactName: `${owner.first_name} ${owner.last_name}`,
      contactEmail: owner.email,
    });
  }

  dataRegistry.poc.forEach((contact: any) => {
    contactPoints.push({
      contactName: contact.first_name + ' ' + contact.last_name,
      contactEmail: contact.email,
    });
  });

  return {
    metadata: {
      assetType: dataRegistry.resource_type === 'dataset' ? 'Dataset' : 'Other',
      titles: [
        {
          titleText: dataRegistry.title,
        },
      ],
      creators: creators,
      contactPoints: contactPoints,
      licenses: licenses.length > 0 ? licenses : undefined,
      externalSourceInformation: {
        externalSourceName: 'LTER-Italy',
        externalSourceURI: url,
      },
      siteReferences: sites,
      language: dataRegistry.language ?? undefined,
    },
  };
}
