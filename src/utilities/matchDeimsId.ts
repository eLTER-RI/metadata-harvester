import { CONFIG } from '../../config';
import { fetchJson } from '../services/pullAllData';
import { SiteReference } from '../store/commonStructure';

export async function fetchSites(): Promise<any> {
  const response = await fetch(CONFIG.DEIMS_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sites: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

export function findMatchingUuid(text: string, sites: { id?: { suffix?: string }; title: string }[]): string[] | null {
  if (typeof text !== 'string') {
    console.warn('Expected a string for text, got:', typeof text);
    return null;
  }

  const uuids = sites.map((site) => site.id?.suffix).filter((uuid): uuid is string => typeof uuid === 'string');

  const pattern = uuids.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'ig');

  const matches = Array.from(text.matchAll(regex), (m) => m[0]);
  return matches.length > 0 ? matches : null;
}

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

async function getDeimsSiteFromDeimsDataset(deimsDatasetUrl: string, sites: any): Promise<SiteReference[]> {
  const deimsDatasetUrlRegex = /(https:\/\/deims\.org\/dataset\/([0-9a-fA-F-]{36}))/;
  let deimsDatasetUrlFromMetadata: string | null = null;
  const match = deimsDatasetUrl.match(deimsDatasetUrlRegex);

  if (match && match[1]) {
    deimsDatasetUrlFromMetadata = match[1];
  }

  if (deimsDatasetUrlFromMetadata) {
    const deimsApiUrl = deimsDatasetUrlFromMetadata.replace('/dataset/', '/api/datasets/');
    try {
      const deimsApiResponse = await fetchJson(deimsApiUrl);
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
