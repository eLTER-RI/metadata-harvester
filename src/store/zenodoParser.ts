import {
  AlternateIdentifier,
  CommonDataset,
  Creator,
  formatDate,
  getChecksum,
  getLicenseURI,
  IdentifierType,
  License,
  parsePID,
  Project,
  ResponsibleOrganizations,
  TemporalCoverage,
} from './commonStructure';

const ZENODO_ASSET_TYPE_MAP = new Map<string, IdentifierType>([
  ['poster', 'Other'],
  ['presentation', 'Other'],
  ['publication-article', 'JournalArticle'],
  ['publication-book', 'Book'],
  ['dataset', 'Dataset'],
  ['image', 'Image'],
  ['image-figure', 'Image'],
  ['video', 'Audiovisual'],
  ['software', 'Software'],
  ['lesson', 'Other'],
  ['physicalobject', 'PhysicalObject'],
  ['other', 'Other'],
]);

const ZENODO_PUBLICATION_SUBTYPE_MAP = new Map<string, IdentifierType>([
  ['annotationcollection', 'Collection'],
  ['book', 'Book'],
  ['section', 'BookChapter'],
  ['conferencepaper', 'ConferencePaper'],
  ['datamanagementplan', 'Other'],
  ['article', 'JournalArticle'],
  ['patent', 'Other'],
  ['preprint', 'Preprint'],
  ['deliverable', 'Other'],
  ['milestone', 'Other'],
  ['proposal', 'Other'],
  ['report', 'Report'],
  ['softwaredocumentation', 'Software'],
  ['taxonomictreatment', 'Text'],
  ['technicalnote', 'Other'],
  ['thesis', 'Dissertation'],
  ['workingpaper', 'Other'],
  ['other', 'Other'],
]);

export function getZenodoAssetType(
  zenodoResourceType: { title?: string; type?: string; subtype?: string } | undefined,
): IdentifierType {
  if (!zenodoResourceType || !zenodoResourceType.type) {
    return 'Dataset';
  }

  const resource_type = zenodoResourceType.type.toLowerCase().trim();
  const publicationType = zenodoResourceType.subtype?.toLowerCase().trim();

  if (resource_type === 'publication') {
    const mappedSubtype = ZENODO_PUBLICATION_SUBTYPE_MAP.get(publicationType || '');
    if (!mappedSubtype) {
      process.stderr.write(
        `Publication type ${mappedSubtype} does not have an alternative in Dar. Setting to 'Other'.\n`,
      );
      return 'Other';
    }
    return mappedSubtype;
  }
  const mappedType = ZENODO_ASSET_TYPE_MAP.get(resource_type);
  if (!mappedType) {
    process.stderr.write(
      `Resource type: "${resource_type}" does not have an alternative in Dar. Setting to 'Other'.\n`,
    );
    return 'Other';
  }
  return mappedType;
}

export async function mapZenodoToCommonDatasetMetadata(
  url: string,
  zenodo: any,
  sites: any,
  repositoryType: 'ZENODO' | 'ZENODO_IT',
): Promise<CommonDataset> {
  const licenses: License[] = [];
  if (zenodo.metadata?.license?.id) {
    licenses.push({
      licenseCode: zenodo.metadata?.license?.id,
      licenseURI: getLicenseURI(zenodo.metadata?.license?.id),
    });
  }
  const alternateIdentifiers: AlternateIdentifier[] = zenodo.metadata.doi
    ? [{ alternateID: zenodo.metadata.doi, alternateIDType: 'DOI' }]
    : [];
  const creators: Creator[] = [];
  zenodo.metadata?.creators.map((creator: any) => {
    let nameParts: string[] = [];
    if (creator.name && typeof creator.name === 'string' && creator.name.includes(',')) {
      nameParts = creator.name.split(',').map((p: string) => p.trim());
    }
    creators.push({
      creatorFamilyName: nameParts.length > 1 ? nameParts[0] : creator.name,
      creatorGivenName: nameParts.length > 1 ? nameParts[1] : '',
      creatorAffiliation: creator.affiliation ? { entityName: creator.affiliation } : undefined,
      creatorIDs: creator.orcid ? [{ entityID: creator.orcid, entityIDSchema: 'orcid' }] : undefined,
    });
  });
  const responsibleOrganizations: ResponsibleOrganizations[] = [];
  const uniqueAffiliations = new Set<string>();
  creators.forEach((creator: Creator) => {
    const creatorAffiliationName = creator.creatorAffiliation?.entityName;
    if (creatorAffiliationName && !uniqueAffiliations.has(creatorAffiliationName)) {
      uniqueAffiliations.add(creatorAffiliationName);
      responsibleOrganizations.push({ organizationName: creatorAffiliationName });
    }
  });
  const publicationDate: string | undefined = formatDate(zenodo.metadata?.publication_date);
  const temporalCoverages: TemporalCoverage[] = [];
  if (zenodo.metadata?.dates && Array.isArray(zenodo.metadata.dates)) {
    zenodo.metadata.dates.forEach((dateObject: any) => {
      if (!dateObject.start && !dateObject.end) {
        return;
      }
      temporalCoverages.push({
        startDate: dateObject.start ? formatDate(dateObject.start) : undefined,
        endDate: dateObject.end ? formatDate(dateObject.end) : undefined,
      });
    });
  }
  if (temporalCoverages.length === 0 && publicationDate) {
    temporalCoverages.push({ startDate: publicationDate, endDate: publicationDate });
  }

  const projects: Project[] = [];
  if (repositoryType === 'ZENODO') {
    projects.push({
      projectName: 'Zenodo external record - eLTER Community',
      projectID: 'https://zenodo.org/communities/elter',
    });
  } else if (repositoryType === 'ZENODO_IT') {
    projects.push({
      projectName: 'Zenodo external record - eLTER-Italy Community',
      projectID: 'https://zenodo.org/communities/lter-italy',
    });
  }
  if (zenodo.metadata?.grants && Array.isArray(zenodo.metadata.grants)) {
    zenodo.metadata.grants.forEach((grant: any) => {
      if (grant.title) {
        projects.push({
          projectName: grant.title,
          projectID: grant.url || grant.internal_id,
        });
      }
    });
  }

  return {
    pids: parsePID(zenodo.metadata.doi) || undefined,
    metadata: {
      assetType: getZenodoAssetType(zenodo.metadata.resource_type),
      alternateIdentifiers: alternateIdentifiers,
      relatedIdentifiers: (zenodo.metadata?.related_identifiers || []).map((relatedId: any) => ({
        relatedID: relatedId.identifier,
        relatedIDType: relatedId.scheme?.toUpperCase() || 'URL',
        relatedResourceType: getZenodoAssetType(relatedId.resource_type) || 'Dataset',
        relationType: relatedId.relation,
      })),
      titles: [{ titleText: zenodo.metadata?.title || zenodo.title || '' }],
      creators: creators,
      descriptions: [
        {
          descriptionText: zenodo.metadata?.description,
          descriptionType: 'Abstract',
        },
      ],
      keywords: (zenodo.metadata?.keywords || []).map((keyword: string) => ({
        keywordLabel: keyword,
      })),
      publicationDate: publicationDate,
      temporalCoverages: temporalCoverages,
      geoLocations: [],
      licenses: licenses,
      files: zenodo.metadata?.files?.map((file: any) => {
        return {
          name: file.key,
          sourceUrl: file.links?.self,
          md5: getChecksum(file.checksum),
          size: file.size.toString(),
          sizeMeasureType: 'B',
        };
      }),
      externalSourceInformation: {
        externalSourceName: 'Zenodo',
        externalSourceURI: url,
      },
      responsibleOrganizations: responsibleOrganizations,
      projects: projects,
      siteReferences: sites,
      language: zenodo.metadata?.language || undefined,
    },
  };
}
