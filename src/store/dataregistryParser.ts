import { CommonDataset, Contact, Creator, Geolocation, getLicenseURI, License } from './commonStructure';

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
    if (owner && contact.last_name !== owner.last_name && contact.first_name !== owner.first_name)
      contactPoints.push({
        contactName: contact.first_name + ' ' + contact.last_name,
        contactEmail: contact.email,
      });
  });

  const geoLocations: Geolocation[] = [];
  if (dataRegistry.resource.bbox_polygon && dataRegistry.resource.bbox_polygon.type === 'Polygon') {
    const coordinates = dataRegistry.resource.bbox_polygon.coordinates[0];
    const points = coordinates.map((coord: number[]) => ({
      longitude: coord[0],
      latitude: coord[1],
    }));
    if (points.length > 0) {
      geoLocations.push({
        boundingPolygon: [
          {
            points: points,
            inPolygonPoint: points[0],
          },
        ],
      });
    }
  }

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
      keywords: (dataRegistry.resource.keywords || []).map((keyword: any) => ({
        keywordLabel: keyword.name,
      })),
      geoLocations: geoLocations,
      licenses: licenses.length > 0 ? licenses : undefined,
      files: dataRegistry.resource.download_url
        ? [
            {
              name: dataRegistry.resource.title,
              sourceUrl: dataRegistry.resource.download_url,
              format: dataRegistry.resource.title.split('.').pop(),
            },
          ]
        : undefined,
      externalSourceInformation: {
        externalSourceName: 'DataRegistry',
        externalSourceURI: url,
      },
      siteReferences: sites,
      language: dataRegistry.resource.language ?? undefined,
    },
  };
}
