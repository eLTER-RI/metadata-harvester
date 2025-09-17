import {
  AdditionalMetadata,
  CommonDataset,
  Contact,
  Creator,
  Description,
  formatDate,
  Geolocation,
  getLicenseURI,
  License,
  parsePID,
} from '../commonStructure';

function getAdditionalMetadata(dataRegistry: any): AdditionalMetadata[] {
  const additional_metadata: AdditionalMetadata[] = [];

  const record = dataRegistry.resource;

  if (record.category?.identifier) {
    additional_metadata.push({
      name: 'category identifier',
      value: record.category.identifier,
    });
  }

  if (record.category?.gn_description) {
    additional_metadata.push({
      name: 'category description',
      value: record.category.gn_description,
    });
  }

  const stringMetadata = ['pk', 'uuid'];

  stringMetadata.forEach((key: string) => {
    if (record[key]) {
      additional_metadata.push({
        name: key,
        value: String(record[key]),
      });
    }
  });

  return additional_metadata;
}

export async function mapDataRegistryToCommonDatasetMetadata(
  url: string,
  dataRegistry: any,
  sites: any,
): Promise<CommonDataset> {
  const licenses: License[] = [];
  if (dataRegistry?.resource?.license?.identifier) {
    licenses.push({
      licenseCode: dataRegistry.resource.license.identifier,
      licenseURI: getLicenseURI(dataRegistry.resource.license.identifier.toLowerCase()),
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

  const descriptions: Description[] = [];
  if (dataRegistry.resource.abstract) {
    descriptions.push({
      descriptionText: dataRegistry.resource.abstract,
      descriptionType: 'Abstract',
    });
  }

  if (dataRegistry.resource.raw_supplemental_information) {
    descriptions.push({
      descriptionText: dataRegistry.resource.raw_supplemental_information,
      descriptionType: 'Other',
    });
  }

  return {
    pids: dataRegistry.resource.doi ? parsePID(dataRegistry.resource.doi) || undefined : undefined,
    metadata: {
      assetType: dataRegistry.resource.resource_type === 'dataset' ? 'Dataset' : 'Other',
      titles: [
        {
          titleText: dataRegistry.resource.title,
        },
      ],
      creators: creators,
      contactPoints: contactPoints,
      descriptions: descriptions,
      keywords: (dataRegistry.resource.keywords || []).map((keyword: any) => ({
        keywordLabel: keyword.name,
      })),
      publicationDate: formatDate(dataRegistry.resource.date),
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
      projects: [
        {
          projectName: 'Dataregistry LTER-Italy DAR',
          projectID: 'https://dataregistry.lteritalia.it/',
        },
      ],
      siteReferences: sites,
      language: dataRegistry.resource.language ?? undefined,
      additionalMetadata: getAdditionalMetadata(dataRegistry),
    },
  };
}
