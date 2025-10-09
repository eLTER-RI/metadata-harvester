import { CONFIG } from '../../config';
import { fetchJson } from '../utilities/fetchJsonFromRemote';
import { SiteReference } from '../store/commonStructure';
import { deimsLimiter } from '../services/rateLimiterConcurrency';

/**
 * Fetches sites from the Deims API based on the deims API url set in the configuration file.
 *
 * @returns {string} Response from the Deims API listing endpoint.
 */
export async function fetchSites(): Promise<any> {
  const response = await fetch(CONFIG.DEIMS_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sites: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

/**
 * Constructs a search URL for the Data Registry (DAR) API to find a record by its external source URI.
 *
 * @param {string} text Data from which matching sites are to be extracted.
 * @param {id: { suffix: string }} sites An object holding sites UUIDS (suffixes of the Deims site
 * self URL and )
 *
 *
 * @returns {string[]} UUIDs matching to existing sites.
 */
export function findMatchingUuid(text: string, sites: { id?: { suffix?: string }; title: string }[]): string[] | null {
  const uuids = sites.map((site) => site.id?.suffix).filter((uuid): uuid is string => typeof uuid === 'string');

  const pattern = uuids.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'ig');

  const matches = Array.from(text.matchAll(regex), (m) => m[0]);
  return matches.length > 0 ? matches : null;
}

/**
 * Goes through a list of matched Deims IDs, and returns an array of sites.
 *
 * @param {string[]} matchedUuids Data from which matching SITES are to be extracted.
 * @param {any} sites An object holding sites returned from the Deims API.
 *
 *
 * @returns {string[]} An object holding Site IDs and names corresponding to the input @param matcheduids.
 */
export function mapUuidsToSiteReferences(matchedUuids: string[] | null, sites: any[]): SiteReference[] {
  if (!matchedUuids || matchedUuids.length === 0) {
    return [];
  }

  const uniqueMatchedSites: SiteReference[] = [];
  const seenUuids = new Set<string>();

  for (const matchedUuid of matchedUuids) {
    const site = sites.find((s: any) => s.id?.suffix === matchedUuid);
    if (site && !seenUuids.has(matchedUuid)) {
      uniqueMatchedSites.push({
        siteID: site.id.suffix,
        siteName: site.title,
      });
      seenUuids.add(matchedUuid);
    }
  }
  return uniqueMatchedSites;
}

/**
 * Searches for a https://deims.org/dataset/{uuid} string inside a string.
 *
 * @param {string} recordData Input string to be searched through.
 * @param {any} sites An object holding sites returned from the Deims API.
 *
 *
 * @returns {string[]} An object holding Site IDs and names corresponding to the input @param matcheduids.
 */
async function getDeimsSiteFromDeimsDataset(recordData: string, sites: any): Promise<SiteReference[]> {
  const deimsDatasetUrlRegex = /(https:\/\/deims\.org\/dataset\/([0-9a-fA-F-]{36}))/;
  let deimsDatasetUrlFromMetadata: string | null = null;
  const match = recordData.match(deimsDatasetUrlRegex);

  if (match && match[1]) {
    deimsDatasetUrlFromMetadata = match[1];
  }

  if (deimsDatasetUrlFromMetadata) {
    const deimsApiUrl = deimsDatasetUrlFromMetadata.replace('/dataset/', '/api/datasets/');
    try {
      const deimsApiResponse = await deimsLimiter.schedule(() => fetchJson(deimsApiUrl));
      if (
        deimsApiResponse &&
        deimsApiResponse.attributes?.general?.relatedSite &&
        Array.isArray(deimsApiResponse.attributes.general.relatedSite) &&
        deimsApiResponse.attributes.general.relatedSite.length > 0
      ) {
        const firstRelatedSite = deimsApiResponse.attributes.general.relatedSite[0];
        if (firstRelatedSite.id?.suffix) {
          const externalRelatedSiteUuid = firstRelatedSite.id.suffix;
          const siteFromExternalUuid = mapUuidsToSiteReferences([externalRelatedSiteUuid], sites);

          if (siteFromExternalUuid.length > 0) {
            return siteFromExternalUuid;
          }
        }
      }
    } catch (error) {
      process.stdout.write(`Error fetching DEIMS API ${deimsApiUrl}: ${error}\n`);
    }
  }
  return [];
}

/**
 * Searches for related Deims IDs of Sites inside a B2Share data object.
 *
 * @param {string} recordData Input string to be searched through.
 * @param {any} sites An object holding sites returned from the Deims API.
 *
 *
 * @returns {string[]} An object holding Site IDs and names corresponding to the input @param matcheduids.
 */
export async function getB2ShareMatchedSites(recordData: any, sites: any): Promise<SiteReference[]> {
  let matchedSites: SiteReference[] = [];

  // We prioritize sites in metadata
  const matchedUuidsFromMetadata = findMatchingUuid(JSON.stringify(recordData.metadata), sites);
  if (matchedUuidsFromMetadata) {
    matchedSites = mapUuidsToSiteReferences(matchedUuidsFromMetadata, sites);
    if (matchedSites.length > 0) {
      return matchedSites;
    }
  }

  const matchedFromMetadata = await getDeimsSiteFromDeimsDataset(JSON.stringify(recordData.metadata), sites);
  if (matchedFromMetadata.length > 0) {
    return matchedFromMetadata;
  }

  const matchedUuidsFromFullRecord = findMatchingUuid(JSON.stringify(recordData), sites);
  if (matchedUuidsFromFullRecord) {
    matchedSites = mapUuidsToSiteReferences(matchedUuidsFromFullRecord, sites);
    if (matchedSites.length > 0) {
      process.stdout.write('Site ' + matchedSites + ' found outside metadata');
      return matchedSites;
    }
  }

  return [];
}

const FIELDSITES_ID_TO_DEIMS_UUID_MAP: { [key: string]: { uuid: string; name: string } } = {
  ANS: { uuid: '64679f32-fb3e-4937-b1f7-dc25e327c7af', name: 'Abisko Scientific Research Station - Sweden' },
  ASA: { uuid: '13b28889-ed32-495a-9bb6-a0886099e6d9', name: 'Asa Experimental Forest and Research Station - Sweden' },
  BOL: { uuid: 'e17d8c56-bf35-411d-a76b-061b6c7a9f0c', name: 'Bolmen Research Station - Sweden' },
  ERK: { uuid: '2c560a19-85bb-4e3b-b41f-9f1d06c6e0d6', name: 'Erken Laboratory - Sweden' },
  GRI: { uuid: 'ba81bcc6-8916-47f3-a54a-5ac8ebe1c455', name: 'Grimsö Wildlife Research Station - Sweden' },
  LON: { uuid: 'd733f936-b0b6-4bc1-9ab5-6cdb4081763a', name: 'Lönnstorp Research Station - Sweden' },
  RBD: { uuid: '7e2e2f68-989c-4e0a-8443-315ea48aac7f', name: 'Röbäcksdalen Field Research Station - Sweden' },
  SRC: { uuid: '13f080f9-4831-4807-91da-bbfecb09a4f2', name: 'Skogaryd Research Catchment - Sweden' },
  SVB: { uuid: 'c0705d0f-92c1-4964-a345-38c0be3113e1', name: 'Svartberget Research Station - Sweden' },
  TRS: { uuid: '332a99af-8c02-4ce8-8f2b-70d17aaacf0a', name: 'Tarfala Research Station - Sweden' },
};

/**
 * Searches for related Deims IDs of Sites inside a fieldSites data object.
 * FieldSites has their own abbreviations of sites that are also saved in
 * Deims. Therefore, sites and their mapping is hardcoded for simplicity.
 *
 * @param {string} recordData Input string to be searched through.
 *
 * @returns {string[]} An object holding Site IDs and names corresponding to the input @param matcheduids.
 */
export function getFieldSitesMatchedSites(recordData: any): SiteReference[] {
  const stationId = recordData?.specificInfo?.acquisition?.station?.id;
  if (stationId) {
    const deims = FIELDSITES_ID_TO_DEIMS_UUID_MAP[stationId];
    if (!deims) {
      return [];
    }
    return [{ siteID: deims?.uuid, siteName: deims?.name }];
  }

  return [];
}

/**
 * Searches for related Deims IDs of Sites inside a Zenodo data object.
 *
 * @param {string} recordData Input string to be searched through.
 * @param {any} sites An object holding sites returned from the Deims API.
 *
 *
 * @returns {string[]} An object holding Site IDs and names corresponding to the input @param matcheduids.
 */
export async function getZenodoMatchedSites(recordData: any, sites: any): Promise<SiteReference[]> {
  let matchedSites: SiteReference[] = [];

  const matchedUuidsFromDescription = findMatchingUuid(recordData.metadata.description, sites);
  if (matchedUuidsFromDescription) {
    matchedSites = mapUuidsToSiteReferences(matchedUuidsFromDescription, sites);
    if (matchedSites.length > 0) {
      return matchedSites;
    }
  }

  if (recordData.metadata.related_identifiers) {
    const matchedUuidsRelatedIds = findMatchingUuid(JSON.stringify(recordData.metadata.related_identifiers), sites);
    if (matchedUuidsRelatedIds) {
      matchedSites = mapUuidsToSiteReferences(matchedUuidsRelatedIds, sites);
      if (matchedSites.length > 0) {
        return matchedSites;
      }
    }
  }

  return [];
}

const DATAREGISTRY_TITLE_TO_DEIMS_MAP: { [key: string]: { uuid: string; name: string } } = {
  'mar piccolo of taranto': {
    uuid: 'ac3f674d-2922-47f6-b1d8-2c91daa81ce1',
    name: 'IT22 - Mar Piccolo of Taranto - Italy',
  },
  vallidicomacchio: {
    uuid: '70e1bc05-a03d-40fc-993d-0c61e524b177',
    name: 'Valli di Comacchio - Italy',
  },
  telesenigallia: {
    uuid: 'be8971c2-c708-4d6e-a4c7-f49fcf1623c1',
    name: 'Transetto Senigallia-Susak - Italy',
  },
  lagunadicabras: {
    uuid: 'd5071d21-9c8f-47cc-b534-1b1162a5e09c',
    name: 'Laguna di Cabras - Italy',
  },
  gulfofvenice: {
    uuid: '758087d7-231f-4f07-bd7e-6922e0c283fd',
    name: 'Golfo di Venezia - Italy',
  },
  lagoonofvenice: {
    uuid: 'cda8c930-378e-44f7-82aa-ea58bf57b611',
    name: 'IT16-Lagoon of Venice - Italy',
  },
};

/**
 * Searches for related Deims IDs of Sites inside a Dataregistry data object.
 * Deims IDs are nicely included in the files that Dataregistry stores, however,
 * there is no such information about it in metadata.
 * Most of Dataregistry files have some information about the site in the title itself,
 * however without any specific formatting, so this might not be as reliable.
 *
 * @param {string} recordData Input string to be searched through.
 *
 * @returns {string[]} An object holding Site IDs and names corresponding to the input @param matcheduids.
 */
export async function getDataRegistryMatchedSites(recordData: any): Promise<SiteReference[]> {
  const title = recordData?.resource?.title;

  if (!title || typeof title !== 'string') {
    return [];
  }
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, ' ');
  const matchedSites: SiteReference[] = [];

  for (const namePart in DATAREGISTRY_TITLE_TO_DEIMS_MAP) {
    if (Object.prototype.hasOwnProperty.call(DATAREGISTRY_TITLE_TO_DEIMS_MAP, namePart)) {
      if (normalizedTitle.includes(namePart)) {
        const siteReference = DATAREGISTRY_TITLE_TO_DEIMS_MAP[namePart];
        matchedSites.push({
          siteID: siteReference?.uuid,
          siteName: siteReference?.name,
        });
      }
    }
  }

  return matchedSites;
}
