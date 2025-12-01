import { B2ShareExtractedSchema, Metadata } from '../../api/schema/b2shareApi';
import { b2shareLimiter, b2shareJuelichLimiter } from '../services/rateLimiterConcurrency';
import { log } from '../services/serviceLogging';
import { fetchJson } from '../utilities/fetchJsonFromRemote';
import {
  AlternateIdentifier,
  Geolocation,
  License,
  Keywords,
  CommonDataset,
  toPID,
  AdditionalMetadata,
  Contributor,
  validContributorTypes,
  isValidEntityIdSchema,
  parsePID,
  ContributorType,
  normalizeDate,
  formatDate,
  getChecksum,
  RelatedIdentifier,
  IdentifierType,
  identifierTypesMap,
  resourceTypesMap,
  Relation,
  PID,
  TemporalCoverage,
  Title,
  Description,
  ObservationLocation,
  File,
} from '../models/commonStructure';

function extractB2ShareGeolocation(input: any): Geolocation[] {
  const coverages: Geolocation[] = [];

  // new format
  if (input.locations?.features && Array.isArray(input.locations.features)) {
    input.locations.features.forEach((feature: any) => {
      if (!feature?.geometry) {
        return;
      }

      const geographicDescription = feature.place || '';

      let observationLocation: ObservationLocation | undefined;
      if (feature.place) {
        const deimsIdMatch = feature.place.match(/deims\.org\/([a-f0-9-]+)/i);
        if (deimsIdMatch) {
          const deimsId = deimsIdMatch[1];
          const nameMatch = feature.place.match(/^([^(]+)/);
          const locationName = nameMatch ? nameMatch[1].trim() : '';
          observationLocation = {
            deimsLocationID: deimsId,
            deimsLocationName: locationName,
          };
        }
      }

      if (feature.geometry.type === 'Point') {
        const coords = feature.geometry.coordinates as number[];
        if (coords && coords.length >= 2) {
          coverages.push({
            geographicDescription,
            observationLocation,
            point: {
              longitude: coords[0],
              latitude: coords[1],
            },
          });
        }
      } else if (feature.geometry.type === 'Envelope') {
        const coords = feature.geometry.coordinates as number[][];
        if (coords && coords.length === 2 && coords[0].length === 2 && coords[1].length === 2) {
          const [west, north] = coords[0];
          const [east, south] = coords[1];

          coverages.push({
            geographicDescription,
            observationLocation,
            boundingBox: {
              westBoundLongitude: west,
              eastBoundLongitude: east,
              northBoundLatitude: north,
              southBoundLatitude: south,
            },
          });
        }
      }
    });
  }

  // old format
  input.spatial_coverages?.map((spatCoverage: any) => {
    if (spatCoverage.point) {
      coverages.push({
        geographicDescription: spatCoverage.place,
        point: {
          latitude: spatCoverage.point.point_latitude,
          longitude: spatCoverage.point.point_longitude,
        },
      });
    }

    if (spatCoverage.box) {
      coverages.push({
        geographicDescription: spatCoverage.place ?? '',
        boundingBox: {
          westBoundLongitude: spatCoverage.box.westbound_longitude,
          eastBoundLongitude: spatCoverage.box.eastbound_longitude,
          northBoundLatitude: spatCoverage.box.northbound_latitude,
          southBoundLatitude: spatCoverage.box.southbound_latitude,
        },
      });
    }

    if (spatCoverage.polygons && spatCoverage.polygons.length > 0) {
      coverages.push({
        geographicDescription: spatCoverage.place,
        boundingPolygon: spatCoverage.polygons.map((polygon: any) => ({
          points:
            polygon.polygon?.map((point: any) => ({
              longitude: point.point_longitude,
              latitude: point.point_latitude,
            })) || [],
          inPolygonPoint: polygon.inpoint
            ? {
                longitude: polygon.inpoint.point_longitude,
                latitude: polygon.inpoint.point_latitude,
              }
            : { longitude: 0, latitude: 0 },
        })),
      });
    }

    return {
      place: spatCoverage.place,
      type: 'unknown',
      coordinates: null,
      elevation: null,
      box: null,
    };
  });
  return coverages || [];
}

export function extractB2ShareAlternateIdentifiers(input: any): AlternateIdentifier[] {
  const identifiers: AlternateIdentifier[] = [];

  // new format
  if (input.identifiers) {
    input.identifiers.forEach((item: any) => {
      if (!item || !item.identifier || !item.scheme) {
        return;
      }

      const scheme = item.scheme.toLowerCase().trim();
      const value = item.identifier.trim();

      if (!value) {
        return;
      }

      // Map scheme to identifier type
      const idType = identifierTypesMap.get(scheme) as IdentifierType | undefined;
      if (idType) {
        identifiers.push({
          alternateID: value,
          alternateIDType: idType,
        });
      }
    });
  }

  //  old format
  if (input.alternate_identifiers) {
    input.alternate_identifiers.forEach((item: any) => {
      if (
        !item ||
        typeof item.alternate_identifier_type !== 'string' ||
        typeof item.alternate_identifier !== 'string'
      ) {
        return;
      }

      const typeKey = item.alternate_identifier_type.toLowerCase().trim();
      const value = item.alternate_identifier.trim();

      if (!value) {
        return;
      }

      const idType = identifierTypesMap.get(typeKey) as IdentifierType | undefined;
      if (idType) {
        identifiers.push({
          alternateID: value,
          alternateIDType: idType,
        });
      }
    });
  }

  return identifiers;
}

export function extractB2ShareCreators(creators: any[] | undefined): any[] | undefined {
  if (!creators || creators.length === 0) {
    return undefined;
  }

  const mappedCreators = creators
    .map((c: any) => {
      let familyName = '';
      let givenName = '';

      // Juelich format
      if (c.creator_name && typeof c.creator_name === 'string') {
        const nameParts = c.creator_name.split(',').map((part: string) => part.trim());
        if (nameParts.length >= 2) {
          familyName = nameParts[0];
          givenName = nameParts.slice(1).join(' ');
        } else {
          // No comma, treat as family name
          familyName = c.creator_name;
        }
      } else {
        // EUDAT format
        const personOrOrg = c.person_or_org || {};
        const name = personOrOrg.name || '';
        givenName = personOrOrg.given_name || '';
        familyName = personOrOrg.family_name || (name && !givenName ? name : '');
      }

      return {
        creatorFamilyName: familyName,
        creatorGivenName: givenName,
        creatorEmail: '',
        creatorAffiliation:
          c.affiliations?.length != undefined && c.affiliations?.length > 0 && c.affiliations[0].affiliation_name
            ? {
                entityName: c.affiliations[0].affiliation_name,
                entityID: {
                  entityID: c.affiliations[0].affiliation_identifier,
                  entityIDSchema: c.affiliations[0].scheme?.toLowerCase(),
                },
              }
            : undefined,
        creatorIDs: c.name_identifiers?.map((i: any) => ({
          entityID: extractIdFromUrl(i.name_identifier),
          entityIDSchema: isValidEntityIdSchema(i.scheme)
            ? i.scheme.toLowerCase()
            : i.scheme_uri && isValidEntityIdSchema(i.scheme_uri)
              ? i.scheme_uri.toLowerCase()
              : undefined,
        })),
      };
    })
    .filter((creator) => {
      // filtering out empty creators
      return (
        (creator.creatorFamilyName && creator.creatorFamilyName.trim()) ||
        (creator.creatorGivenName && creator.creatorGivenName.trim()) ||
        (creator.creatorEmail && creator.creatorEmail.trim())
      );
    });

  return mappedCreators.length > 0 ? mappedCreators : undefined;
}

export function extractB2ShareContributors(contributors: any[] | undefined): {
  personalContributors: Contributor[];
  organizationalContributors: any[];
} {
  const personalContributors: Contributor[] = [];
  const organizationalContributors: any[] = [];

  if (!contributors || contributors.length === 0) {
    return { personalContributors, organizationalContributors };
  }

  contributors.forEach((c: any) => {
    const personOrOrg = c.person_or_org || {};
    const isOrganization = personOrOrg.type === 'organizational';

    if (isOrganization) {
      // Store organizations for responsibleOrganizations
      organizationalContributors.push(c);
    } else {
      // Process personal contributors
      let familyName = '';
      let givenName = '';

      // Juelich format
      if (c.contributor_name && typeof c.contributor_name === 'string') {
        const nameParts = c.contributor_name.split(',').map((part: string) => part.trim());
        if (nameParts.length >= 2) {
          familyName = nameParts[0];
          givenName = nameParts.slice(1).join(' ');
        } else {
          // No comma, treat as family name
          familyName = c.contributor_name;
        }
      } else {
        // EUDAT format
        const name = personOrOrg.name || '';
        givenName = personOrOrg.given_name || '';
        familyName = personOrOrg.family_name || (name && !givenName ? name : '');
      }

      const contributor: Contributor = {
        contributorFamilyName: familyName,
        contributorGivenName: givenName,
        contributorAffiliation:
          c.affiliations?.length != undefined && c.affiliations?.length > 0 && c.affiliations[0].affiliation_name
            ? {
                entityName: c.affiliations[0].affiliation_name,
                entityID: {
                  entityID: c.affiliations[0].affiliation_identifier
                    ? extractIdFromUrl(c.affiliations[0].affiliation_identifier)
                    : undefined,
                  entityIDSchema: c.affiliations[0].scheme?.toLowerCase(),
                },
              }
            : undefined,
        contributorIDs: c.name_identifiers
          ?.map((i: any) => ({
            entityID: i.name_identifier ? extractIdFromUrl(i.name_identifier) : undefined,
            entityIDSchema: i.scheme ? i.scheme?.toLowerCase() : i.scheme_uri ? i.scheme_uri?.toLowerCase() : undefined,
          }))
          .filter(
            (a: any) =>
              (a.entityID?.length == 0 || a.entityID == null) &&
              (a.entityIDSchema == undefined || a.entityIDSchema?.length == 0 || a.entityIDSchema == null),
          ),
        contributorType: validContributorTypes.has(c.role?.id as ContributorType)
          ? (c.role?.id as ContributorType)
          : validContributorTypes.has(c.contributor_type as ContributorType)
            ? (c.contributor_type as ContributorType)
            : ('Other' as ContributorType),
      };
      personalContributors.push(contributor);
    }
  });

  return { personalContributors, organizationalContributors };
}

export function extractB2ShareOrganizations(organizationalContributors: any[]): any[] {
  if (organizationalContributors.length === 0) {
    return [];
  }

  return organizationalContributors
    .map((c: any) => {
      const personOrOrg = c.person_or_org || {};
      const orgName = personOrOrg.name || '';
      return {
        organizationName: orgName,
        organizationID:
          c.name_identifiers?.length > 0
            ? {
                entityID: c.name_identifiers[0].name_identifier
                  ? extractIdFromUrl(c.name_identifiers[0].name_identifier)
                  : undefined,
                entityIDSchema: c.name_identifiers[0].scheme
                  ? c.name_identifiers[0].scheme.toLowerCase()
                  : c.name_identifiers[0].scheme_uri
                    ? c.name_identifiers[0].scheme_uri.toLowerCase()
                    : undefined,
              }
            : undefined,
      };
    })
    .filter((org: any) => org.organizationName !== '');
}

export function extractB2ShareRelatedIdentifiers(input: Metadata): RelatedIdentifier[] {
  const identifiers: RelatedIdentifier[] = [];
  input.related_identifiers?.forEach((item) => {
    if (
      !item ||
      typeof item.related_identifier !== 'string' ||
      !item.related_identifier.trim() ||
      typeof item.related_identifier_type !== 'string' ||
      !item.related_identifier_type.trim() ||
      typeof item.relation_type !== 'string' ||
      !item.relation_type.trim()
    ) {
      return;
    }

    const typeKey = item.related_identifier_type.toLowerCase().trim();
    const value = item.related_identifier.trim();

    if (!value) {
      return;
    }

    const idType = identifierTypesMap.get(typeKey) as IdentifierType | 'Other';
    const resourceType = (typeof item.resource_type === 'string' ? item.resource_type || '' : '').toLowerCase().trim();
    const resourceTypeFromMap = resourceTypesMap.get(resourceType) as IdentifierType | 'Other';
    identifiers.push({
      relatedID: value,
      relatedIDType: idType,
      relationType: item.relation_type.trim() as Relation,
      relatedResourceType: resourceTypeFromMap,
    });
  });

  return identifiers;
}

function extractB2ShareKeywords(input: any): Keywords[] {
  const keywords: Keywords[] = [];

  if (input.keywords && Array.isArray(input.keywords)) {
    input.keywords.forEach((kw: any) => {
      if (kw && typeof kw === 'string' && kw.trim().length > 0) {
        const trimmedKw = kw.trim();
        const splitKeywords = trimmedKw.split(/\s*[;,]\s*/);
        if (splitKeywords.length > 1) {
          splitKeywords.forEach((keyword: string) => {
            const trimmedKeyword = keyword.trim();
            if (trimmedKeyword.length > 0) {
              keywords.push({
                keywordLabel: trimmedKeyword,
                keywordURI: undefined,
              });
            }
          });
        } else {
          keywords.push({
            keywordLabel: trimmedKw,
            keywordURI: trimmedKw,
          });
        }
      }
    });
  }

  input.subjects?.forEach((subject: any) => {
    if (subject?.subject) {
      if (subject.id || subject.scheme) {
        keywords.push({
          keywordLabel: subject.subject,
        });
      } else {
        const splitKeywords = subject.subject.split(/\s*[;,]\s*/);
        splitKeywords.forEach((keyword: string) => {
          if (keyword.length) {
            keywords.push({
              keywordLabel: keyword,
            });
          }
        });
      }
    }
  });
  return keywords;
}
function formatDateB2Share(isoString: string): string | undefined {
  const normalized = normalizeDate(isoString);
  return normalized ? formatDate(normalized) : undefined;
}

function extractTemporalCoverages(b2share: any): TemporalCoverage[] | undefined {
  if (b2share.metadata.temporal_coverages?.ranges?.length > 0) {
    const coverages = b2share.metadata.temporal_coverages.ranges.map((t: any) => {
      const startDate = t.start_date ? formatDateB2Share(t.start_date) : undefined;
      const endDate = t.end_date ? formatDateB2Share(t.end_date) : undefined;
      return {
        startDate,
        endDate: endDate || startDate,
      };
    });
    return coverages.filter((tc: any) => tc.startDate).length > 0 ? coverages : undefined;
  }

  if (b2share.metadata.publication_date) {
    const pubDate = formatDateB2Share(b2share.metadata.publication_date);
    if (pubDate) {
      return [
        {
          startDate: pubDate,
          endDate: pubDate,
        },
      ];
    }
  }

  return undefined;
}

function extractB2ShareTitles(metadata: any): Title[] {
  // new format
  if (metadata.titles && Array.isArray(metadata.titles) && metadata.titles.length > 0) {
    return metadata.titles.map((t: any) => ({
      titleText: typeof t === 'string' ? t : t.title || t.titleText || '',
      titleLanguage: t.language || t.titleLanguage || '',
    }));
  }
  // old format
  if (metadata.title) {
    return [{ titleText: metadata.title, titleLanguage: '' }];
  }
  return [];
}

function extractB2ShareDescriptions(metadata: any): Description[] | undefined {
  // new format
  if (metadata.description && typeof metadata.description === 'string') {
    return [{ descriptionText: metadata.description, descriptionType: 'Abstract' }];
  }
  // old format
  if (metadata.descriptions && Array.isArray(metadata.descriptions) && metadata.descriptions.length > 0) {
    return metadata.descriptions.map((d: any) => ({
      descriptionText: d.description,
      descriptionType: d.description_type || 'Abstract',
    }));
  }
  return undefined;
}

function extractB2ShareFiles(b2share: any): File[] | undefined {
  // EUDAT format: files.entries (object)
  if (b2share.files?.entries && !Array.isArray(b2share.files) && typeof b2share.files.entries === 'object') {
    return Object.values(b2share.files.entries).map((f: any) => ({
      name: f.key,
      sourceUrl: f.pids?.epic?.identifier
        ? convertHttpToHttps(f.pids.epic.identifier)
        : f.ePIC_PID
          ? convertHttpToHttps(f.ePIC_PID)
          : undefined,
      md5: getChecksum(f.checksum),
      size: f.size?.toString(),
      sizeMeasureType: 'B',
      format: f.key?.split('.').pop(),
    }));
  }
  // Juelich format: files (array)
  if (Array.isArray(b2share.files) && b2share.files.length > 0) {
    return b2share.files.map((f: any) => ({
      name: f.key,
      sourceUrl: f.ePIC_PID
        ? convertHttpToHttps(f.ePIC_PID)
        : f.pids?.epic?.identifier
          ? convertHttpToHttps(f.pids.epic.identifier)
          : undefined,
      md5: getChecksum(f.checksum),
      size: f.size?.toString(),
      sizeMeasureType: 'B',
      format: f.key?.split('.').pop(),
    }));
  }
  return undefined;
}

function convertHttpToHttps(url: string): string {
  if (url.startsWith('http://')) {
    return 'https://' + url.slice(7);
  }
  return url;
}

function extractIdFromUrl(input: string): string {
  try {
    const url = new URL(input);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : input;
  } catch {
    return input;
  }
}

function parseB2shareAlternateIdentifiers(b2share: any): AlternateIdentifier[] {
  const identifiers = extractB2ShareAlternateIdentifiers(b2share.metadata);

  if (b2share.pids?.doi?.identifier) {
    identifiers.push({
      alternateID: b2share.pids.doi.identifier,
      alternateIDType: 'DOI',
    });
  }

  // new format
  if (b2share.pids?.epic?.identifier) {
    identifiers.push({
      alternateID: b2share.pids.epic.identifier,
      alternateIDType: 'Handle',
    });
  }

  // old format
  if (b2share.metadata.ePIC_PID && typeof b2share.metadata.ePIC_PID === 'string') {
    identifiers.push({
      alternateID: b2share.metadata.ePIC_PID,
      alternateIDType: 'Handle',
    });
  }

  return identifiers;
}

function getAdditionalMetadata(b2share: any): AdditionalMetadata[] {
  const additional_metadata: AdditionalMetadata[] = [];
  if (b2share.metadata.version) {
    additional_metadata.push({
      name: 'version',
      value: b2share.metadata.version,
    });
  }
  if (b2share.metadata.publication_state) {
    additional_metadata.push({
      name: 'publication_state',
      value: b2share.metadata.publication_state,
    });
  }
  if (b2share.parent?.communities?.ids?.[0]) {
    additional_metadata.push({
      name: 'community',
      value: b2share.parent.communities.ids[0],
    });
  }

  const isPublic = b2share.access?.record === 'public' || b2share.access?.files === 'public';
  if (b2share.access) {
    additional_metadata.push({
      name: 'access_right',
      value: isPublic ? 'open' : 'not open',
    });
  }

  return additional_metadata;
}

// CRITICAL: externalSourceURI is used as database primary key (source_url)
// The return value `url` of this function is used as the externalSourceURI
// Do not modify this logic
async function handleB2ShareVersioning(
  url: string,
  b2share: any,
  repositoryType: 'B2SHARE_EUDAT' | 'B2SHARE_JUELICH',
): Promise<[string, B2ShareExtractedSchema, RelatedIdentifier[]]> {
  const relatedIdentifiers: RelatedIdentifier[] = [];
  const limiter = repositoryType === 'B2SHARE_EUDAT' ? b2shareLimiter : b2shareJuelichLimiter;

  if (!b2share.links?.versions) {
    return [url, b2share, []];
  }

  try {
    const versions = await limiter.schedule(async () => await fetchJson(b2share.links.versions));
    if (!versions || !versions.hits?.hits) {
      return [url, b2share, []];
    }

    const allVersions = versions.hits.hits;
    const latestVersion = allVersions.find((hit: any) => hit.versions?.is_latest);
    if (!latestVersion) {
      return [url, b2share, []];
    }

    for (const versionHit of allVersions) {
      if (versionHit.id === latestVersion.id) continue;

      relatedIdentifiers.push({
        relatedID: versionHit.links.self,
        relatedIDType: 'URL',
        relatedResourceType: 'Dataset',
        relationType: 'IsNewVersionOf', // we have the latest, all other are old
      });
    }

    // If we found a version that is most recent, we fetch it, and continue parsing with new data
    if (latestVersion.id !== b2share.id) {
      const latestUrl = latestVersion.links.self;
      log('warn', 'New version for record on url: ' + url + ' found: ' + latestUrl);
      const latestRecordData = await limiter.schedule(async () => await fetchJson(latestUrl));
      if (latestRecordData) {
        return [latestUrl, latestRecordData, relatedIdentifiers];
      }
    }

    return [url, b2share, relatedIdentifiers];
  } catch (error) {
    log('error', `Failed to process B2Share versions for ${url}: ${error}`);
    return [url, b2share, []];
  }
}

export async function mapB2ShareToCommonDatasetMetadata(
  url: string,
  recordData: B2ShareExtractedSchema,
  sites: any,
  repositoryType: 'B2SHARE_EUDAT' | 'B2SHARE_JUELICH',
): Promise<CommonDataset> {
  let b2share: any = recordData;
  const [latestUrl, latestData, versionRelations] = await handleB2ShareVersioning(url, recordData, repositoryType);
  if (latestData) b2share = latestData;

  const licenses: License[] = [];
  if (b2share.metadata.rights && Array.isArray(b2share.metadata.rights) && b2share.metadata.rights.length > 0) {
    for (const right of b2share.metadata.rights) {
      const licenseUrl = right.props?.url || right.link;
      if (licenseUrl) {
        const licenseTitle =
          typeof right.title === 'object' && right.title !== null
            ? right.title.en || Object.values(right.title)[0]
            : right.title || right.id;
        licenses.push({
          licenseCode: licenseTitle || undefined,
          licenseURI: convertHttpToHttps(licenseUrl),
        });
      }
    }
  }

  const alternateIdentifiers = parseB2shareAlternateIdentifiers(b2share);
  const related_identifiers = extractB2ShareRelatedIdentifiers(b2share.metadata);
  related_identifiers.push(...versionRelations);
  const additional_metadata = getAdditionalMetadata(b2share);
  let parsedPID: PID | undefined = undefined;
  if (b2share.pids?.doi?.identifier) {
    parsedPID = parsePID(b2share.pids.doi.identifier);
    if (!parsedPID && b2share.pids.doi.provider) {
      parsedPID = {
        doi: {
          identifier: b2share.pids.doi.identifier,
          provider: b2share.pids.doi.provider,
        },
      };
    }
  }

  const pids = parsedPID ?? toPID(alternateIdentifiers);

  const { personalContributors, organizationalContributors } = extractB2ShareContributors(
    b2share.metadata.contributors,
  );
  const result: CommonDataset = {
    pids: pids,
    metadata: {
      assetType: 'Dataset',
      alternateIdentifiers: alternateIdentifiers,
      relatedIdentifiers: related_identifiers,
      titles: extractB2ShareTitles(b2share.metadata),
      creators: extractB2ShareCreators(b2share.metadata.creators),
      contactPoints: (() => {
        // new format
        if (
          b2share.metadata.contact_emails &&
          Array.isArray(b2share.metadata.contact_emails) &&
          b2share.metadata.contact_emails.length > 0
        ) {
          return b2share.metadata.contact_emails
            .map((item: any) => {
              const email = item.contact_email || item;
              return typeof email === 'string'
                ? {
                    contactEmail: email.trim(),
                    contactName: '',
                  }
                : null;
            })
            .filter((e: any) => e && e.contactEmail !== '');
        }
        // old format
        if (b2share.metadata.contact_email && typeof b2share.metadata.contact_email === 'string') {
          return b2share.metadata.contact_email
            .split(/[;, ]+/)
            .map((e: string) => {
              return {
                contactEmail: e.trim(),
                contactName: '',
              };
            })
            .filter((e: any) => e.contactEmail !== '');
        }
        return undefined;
      })(),
      descriptions: extractB2ShareDescriptions(b2share.metadata),
      keywords: extractB2ShareKeywords(b2share.metadata) || undefined,
      contributors: personalContributors.length > 0 ? personalContributors : undefined,
      publicationDate: b2share.metadata.publication_date
        ? formatDateB2Share(b2share.metadata.publication_date)
        : b2share.created
          ? formatDateB2Share(b2share.created)
          : undefined,
      temporalCoverages: extractTemporalCoverages(b2share),
      geoLocations: extractB2ShareGeolocation(b2share.metadata),
      licenses: licenses.length > 0 ? licenses : undefined,
      files: extractB2ShareFiles(b2share),
      externalSourceInformation: {
        externalSourceName: repositoryType == 'B2SHARE_EUDAT' ? 'B2Share Eudat' : 'B2Share Juelich',
        // CRITICAL: externalSourceURI is used as database primary key (source_url)
        externalSourceURI: b2share.links?.self || latestUrl,
      },
      language:
        typeof b2share.metadata.language === 'string'
          ? b2share.metadata.language
          : b2share.metadata.languages?.map((l: any) => l.id || l.language_name).join() || undefined,
      responsibleOrganizations: extractB2ShareOrganizations(organizationalContributors),
      taxonomicCoverages: [],
      methods: [],
      projects:
        repositoryType == 'B2SHARE_EUDAT'
          ? [
              {
                projectName: 'B2SHARE Eudat external record - eLTER Community',
                projectID: 'https://b2share.eudat.eu/communities/LTER',
              },
            ]
          : [
              {
                projectName: 'B2SHARE Juelich external record - eLTER Community',
                projectID: 'https://b2share.fz-juelich.de/communities/LTER',
              },
            ],
      siteReferences: sites,
      habitatReferences: [],
      additionalMetadata: additional_metadata,
    },
  };
  return result;
}
