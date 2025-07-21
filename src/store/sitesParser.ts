import {
  License,
  CommonDataset,
  Creator,
  AlternateIdentifier,
  RelatedIdentifier,
  Contact,
  Description,
  formatDate,
} from './commonStructure';

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

  const relatedIdentifiers: RelatedIdentifier[] = [];
  if (fieldSites.previousVersion) {
    const previousVersions = Array.isArray(fieldSites.previousVersion)
      ? fieldSites.previousVersion
      : [fieldSites.previousVersion];

    previousVersions.forEach((versionUrl: string) => {
      if (typeof versionUrl === 'string' && versionUrl.trim() !== '') {
        relatedIdentifiers.push({
          relatedID: versionUrl,
          relatedIDType: 'URL',
          relatedResourceType: 'Dataset',
          relationType: 'IsNewVersionOf',
        });
      }
    });
  }

  if (fieldSites.latestVersion) {
    // if latestVersion === id or there is no nextVersion => keep, else delete
    relatedIdentifiers.push({
      relatedID: fieldSites.latestVersion,
      relatedIDType: 'URL',
      relatedResourceType: 'Dataset',
      relationType: 'IsVersionOf',
    });
  }

  // add collection also to metadata
  if (fieldSites.parentCollections) {
    const parentCollections = Array.isArray(fieldSites.parentCollections)
      ? fieldSites.parentCollections
      : [fieldSites.parentCollections];

    parentCollections.forEach((collectionUrl: string) => {
      if (typeof collectionUrl === 'string' && collectionUrl.trim() !== '') {
        relatedIdentifiers.push({
          relatedID: collectionUrl,
          relatedIDType: 'URL',
          relatedResourceType: 'Collection',
          relationType: 'IsPartOf',
        });
      }
    });
  }

  const contactPoints: Contact[] = [];
  if (fieldSites.submission?.submitter?.email) {
    contactPoints.push({
      contactEmail: fieldSites.submission.submitter.email,
      contactName: fieldSites.submission.submitter.name,
    });
  }

  if (fieldSites.station?.org?.email && fieldSites.station?.org?.email !== fieldSites.submission?.submitter?.email) {
    contactPoints.push({
      contactEmail: fieldSites.station.org.email,
      contactName: fieldSites.station.org.name,
    });
  }

  const descriptions: Description[] = [];
  if (fieldSites.specification?.self?.comments && fieldSites.specification.self.comments.length > 0) {
    descriptions.push({
      descriptionText: fieldSites.specification.self.comments.join('\n'),
      descriptionType: 'Abstract',
    });
  }
  if (
    fieldSites.specificInfo?.acquisition?.station?.org?.self?.comments &&
    fieldSites.specificInfo.acquisition.station.org.self.comments.length > 0
  ) {
    descriptions.push({
      descriptionText: fieldSites.specificInfo.acquisition.station.org.self.comments.join('\n'),
      descriptionType: 'Other',
    });
  }

  const publicationDate = formatDate(
    fieldSites.references.temporalCoverageDisplay?.split('–')[0] || fieldSites.submission.start,
  );

  const temporalCoverages: { startDate?: string; endDate?: string }[] = [];
  if (fieldSites.references.temporalCoverageDisplay) {
    const [startDate, endDate] = fieldSites.references.temporalCoverageDisplay
      .split('–')
      .map((date: string) => formatDate(date.trim()));
    if (startDate && endDate) {
      temporalCoverages.push({ startDate, endDate });
    }
  }

  if (fieldSites.specificInfo?.acquisition?.interval) {
    const startDate = formatDate(fieldSites.specificInfo.acquisition.interval.start);
    const endDate = formatDate(fieldSites.specificInfo.acquisition.interval.stop);

    const newCoverage = { startDate, endDate };
    if (!temporalCoverages.some((tc) => tc.startDate === newCoverage.startDate && tc.endDate === newCoverage.endDate)) {
      temporalCoverages.push(newCoverage);
    }
  }

  return {
    metadata: {
      assetType: 'Dataset',
      alternateIdentifiers: alternateIdentifiers,
      relatedIdentifiers: relatedIdentifiers,
      titles: [
        {
          titleText: fieldSites.references.title,
        },
      ],
      creators: creators,
      contactPoints: contactPoints,
      descriptions: descriptions,
      keywords: fieldSites.specification?.keywords?.map((keyword: string) => ({
        keywordLabel: keyword,
      })),
      publicationDate: publicationDate,
      temporalCoverages: temporalCoverages,
      licenses: licenses,
      externalSourceInformation: {
        externalSourceName: 'fieldsites',
        externalSourceURI: url,
      },
      responsibleOrganizations: [],
      siteReferences: [],
      dataLevel: {
        dataLevelCode: fieldSites.specification.dataLevel.toString(),
      },
    },
  };
}
