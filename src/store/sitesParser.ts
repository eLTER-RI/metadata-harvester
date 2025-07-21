import { License, CommonDataset, Creator, AlternateIdentifier } from './commonStructure';

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

  const creators: Creator[] = [];
  if (fieldSites.submission?.submitter) {
    creators.push({
      creatorFamilyName: fieldSites.submission.submitter.name,
      creatorGivenName: '',
      creatorAffiliation: {
        entityName: fieldSites.submission.submitter.name,
        entityID: {
          entityID: fieldSites.submission.submitter.self.uri,
          entityIDSchema: 'URI',
        },
      },
      creatorIDs: [],
    });
  }

  const responsibleOrganization: string[] = [];
  if (fieldSites.specificInfo?.acquisition?.station?.responsibleOrganization) {
    creators.push({
      creatorFamilyName: fieldSites.specificInfo.acquisition.station.responsibleOrganization.name,
      creatorAffiliation: {
        entityName: fieldSites.specificInfo.acquisition.station.responsibleOrganization.name,
        entityID: {
          entityID: fieldSites.specificInfo.acquisition.station.responsibleOrganization.self.uri,
          entityIDSchema: 'URI',
        },
      },
      creatorIDs: [],
    });
    if (fieldSites.specificInfo?.acquisition?.station?.responsibleOrganization) {
      responsibleOrganization.push(fieldSites.specificInfo.acquisition.station.responsibleOrganization.name);
    }
  }

  const alternateIdentifiers: AlternateIdentifier[] = [];
  if (fieldSites.pid) {
    alternateIdentifiers.push({
      alternateID: fieldSites.pid,
      alternateIDType: 'Handle',
    });
  }

  return {
    metadata: {
      assetType: 'Dataset',
      alternateIdentifiers: alternateIdentifiers,
      externalSourceInformation: {
        externalSourceName: 'fieldsites',
        externalSourceURI: url,
      },
      titles: [
        {
          titleText: fieldSites.references.title,
        },
      ],
      creators: creators,
      licenses: licenses,
      responsibleOrganizations: [],
      siteReferences: sites,
    },
  };
}
