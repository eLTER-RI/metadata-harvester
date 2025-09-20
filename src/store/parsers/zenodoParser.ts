import { fetchJson } from '../../utilities/fetchJsonFromRemote';
import {
  AdditionalMetadata,
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
  Relation,
  ResponsibleOrganizations,
  TemporalCoverage,
} from '../commonStructure';

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

const ZENODO_RELATION_MAP = new Map<string, Relation>([
  ['iscitedby', 'IsCitedBy'],
  ['cites', 'Cites'],
  ['issupplementto', 'IsSupplementTo'],
  ['ispublishedin', 'IsPublishedIn'],
  ['issupplementedby', 'IsSupplementedBy'],
  ['iscontinuedby', 'IsContinuedBy'],
  ['continues', 'Continues'],
  ['hasmetadata', 'HasMetadata'],
  ['ismetadatafor', 'IsMetadataFor'],
  ['isnewversionof', 'IsNewVersionOf'],
  ['ispreviousversionof', 'IsPreviousVersionOf'],
  ['ispartof', 'IsPartOf'],
  ['haspart', 'HasPart'],
  ['isreferencedby', 'IsReferencedBy'],
  ['references', 'References'],
  ['isdocumentedby', 'IsDocumentedBy'],
  ['documents', 'Documents'],
  ['iscompiledby', 'isCompiledBy'],
  ['compiles', 'Compiles'],
  ['isvariantformof', 'IsVariantFormOf'],
  ['isoriginalformof', 'IsOriginalFormOf'],
  ['isidenticalto', 'IsIdenticalTo'],
  ['isalternateidentifier', 'IsIdenticalTo'],
  ['isreviewedby', 'IsReviewedBy'],
  ['reviews', 'Reviews'],
  ['isderivedfrom', 'IsDerivedFrom'],
  ['issourceof', 'IsSourceOf'],
  ['describes', 'Describes'],
  ['isdescribedby', 'IsDescribedBy'],
  ['requires', 'Requires'],
  ['isrequiredby', 'IsRequiredBy'],
  ['isobsoletedby', 'IsObsoletedBy'],
  ['obsoletes', 'Obsoletes'],
]);

const ZENODO_ID_TYPE_MAP = new Map<string, IdentifierType>([
  ['ark', 'ARK'],
  ['arxiv', 'arXiv'],
  ['bibcode', 'bibcode'],
  ['doi', 'DOI'],
  ['ean13', 'EAN13'],
  ['eissn', 'EISSN'],
  ['handle', 'Handle'],
  ['isbn', 'ISBN'],
  ['issn', 'ISSN'],
  ['istc', 'ISTC'],
  ['lissn', 'LISSN'],
  ['lsid', 'LSID'],
  ['orcid', 'ORCID'],
  ['pmid', 'PMID'],
  ['purl', 'PURL'],
  ['upc', 'UPC'],
  ['url', 'URL'],
  ['urn', 'URN'],
  ['w3id', 'w3id'],
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

export function getZenodoRelationType(zenodoRelation: string | undefined): Relation | undefined {
  if (typeof zenodoRelation !== 'string') {
    return undefined;
  }

  const normalizedRelation = zenodoRelation.toLowerCase().trim();
  const mappedRelation = ZENODO_RELATION_MAP.get(normalizedRelation);

  if (mappedRelation) {
    return mappedRelation;
  } else {
    process.stdout.write(`Unknown Zenodo relation: "${zenodoRelation}". Mapping to 'Other'.`);
    return undefined;
  }
}

export function getZenodoIdentifierType(zenodoIdentifierType: string | undefined): IdentifierType | undefined {
  if (typeof zenodoIdentifierType !== 'string') {
    return undefined;
  }

  const normalizedRelation = zenodoIdentifierType.toLowerCase().trim();
  const mappedRelation = ZENODO_ID_TYPE_MAP.get(normalizedRelation);

  if (mappedRelation) {
    return mappedRelation;
  } else {
    process.stderr.write(`Unknown Zenodo identifier type: "${zenodoIdentifierType}". Mapping to 'Other'.`);
    return undefined;
  }
}

function mapZenodoCommunitiesToProjects(communitiesArray: { id: string }[]): Project[] {
  if (!communitiesArray || communitiesArray.length === 0) {
    return [];
  }

  const projects: Project[] = [];

  for (const community of communitiesArray) {
    const communityId = community.id.toLowerCase();
    switch (communityId) {
      case 'elter':
        projects.push({
          projectName: 'Zenodo external record - eLTER Community',
          projectID: `https://zenodo.org/communities/${community.id}`,
        });
        break;
      case 'lter-italy':
        projects.push({
          projectName: 'Zenodo external record - eLTER-Italy Community',
          projectID: `https://zenodo.org/communities/${community.id}`,
        });
        break;
      default:
        projects.push({
          projectName: `Zenodo Community: ${community.id}`,
          projectID: `https://zenodo.org/communities/${community.id}`,
        });
        break;
    }
  }

  return projects;
}

function getAdditionalMetadata(zenodo: any): AdditionalMetadata[] {
  const additional_metadata: AdditionalMetadata[] = [];
  if (zenodo.metadata.version) {
    additional_metadata.push({
      name: 'version',
      value: zenodo.metadata.version,
    });
  }
  if (zenodo.status) {
    additional_metadata.push({
      name: 'status',
      value: zenodo.status,
    });
  }
  if (zenodo.metadata.open_access) {
    additional_metadata.push({
      name: 'access_right',
      value: zenodo.metadata.open_access ? 'open' : 'not open',
    });
  }
  if (zenodo.metadata.grants) {
    additional_metadata.push({
      name: 'grants',
      value: JSON.stringify(zenodo.metadata.grants, null, 2),
    });
  }

  return additional_metadata;
}

export async function getLatestZenodoVersionUrl(url: string, zenodo: any): Promise<any> {
  if (zenodo.metadata.relations?.version[0]?.is_last || !zenodo.links?.versions) {
    return [null, null];
  }

  try {
    const versions = await fetchJson(zenodo.links.versions);
    const latestVersion = versions.hits.hits.find((hit: any) => hit.metadata.relations?.version[0]?.is_last);

    if (latestVersion) {
      const newUrl = latestVersion.links.self;
      const recordData = await fetchJson(newUrl);
      if (!recordData) return [null, null];
      return [latestVersion.links.self, recordData];
    }
  } catch {
    return [null, null];
  }
}

function sortCommunities(recordData: any) {
  const records = recordData?.metadata?.communities;
  if (!records || !records.length) return [];
  records.sort((a: any, b: any) => {
    const idA = a.metadata.communities.length > 0 ? a.metadata.communities[0].id : '';
    const idB = b.metadata.communities.length > 0 ? b.metadata.communities[0].id : '';

    if (idA < idB) {
      return -1;
    }
    if (idA > idB) {
      return 1;
    }
    return 0;
  });
}

export async function mapZenodoToCommonDatasetMetadata(
  sourceUrl: string,
  recordData: any,
  sites: any,
): Promise<CommonDataset> {
  // First, let's check if the record is not old
  const [latestUrl, latestData] = await getLatestZenodoVersionUrl(sourceUrl, recordData);
  const zenodo = latestData ?? recordData;
  const url = latestUrl ?? sourceUrl;
  const communities = sortCommunities(zenodo.metadata.communities);
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

  const projects: Project[] = mapZenodoCommunitiesToProjects(communities);
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
        relatedIDType: getZenodoIdentifierType(relatedId.scheme) || 'URL',
        relatedResourceType: getZenodoAssetType(relatedId.resource_type) || 'Dataset',
        relationType: getZenodoRelationType(relatedId.relation),
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
      files: zenodo.files?.map((file: any) => {
        return {
          name: file.key,
          sourceUrl: file.links?.self,
          md5: getChecksum(file.checksum),
          size: file.size.toString(),
          sizeMeasureType: 'B',
          format: file.key?.split('.').pop(),
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
      additionalMetadata: getAdditionalMetadata(zenodo),
    },
  };
}
