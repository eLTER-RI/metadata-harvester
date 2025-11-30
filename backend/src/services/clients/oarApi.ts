import { log } from '../serviceLogging';
import { CONFIG } from '../../config/config';

export interface SourceFiles {
  usedSourceFiles: 'All' | 'Selected';
  sourceFileUrls?: string[] | null;
}

export interface CreateOARRequest {
  darAssetId: string;
  darAssetType: string;
  sourceFiles: SourceFiles;
  onlineUrl: string;
  metadata: Record<string, any>;
  serviceType: string;
  expectedLifetime?: string;
}

export interface OARResponse {
  id: string;
  darAssetId: string;
  darAssetType: string;
  sourceFiles: SourceFiles;
  onlineUrl: string;
  metadata: Record<string, any>;
  serviceType: string;
  state: string;
  createdAt: string;
  stateUpdatedAt: string;
  expectedLifetime: string;
}

/**
 * Sends a GET request to the OAR API for online assets.
 * @param {string} darAssetId The DAR asset ID
 * @returns Array of online assets, or null if the request fails
 */
export async function getOnlineAssets(darAssetId: string): Promise<OARResponse[] | null> {
  const oarApiUrl = `${CONFIG.API_URL}/oar/online-assets`;
  const url = `${oarApiUrl}?darAssetId=${encodeURIComponent(darAssetId)}&darAssetType=external-dataset`;
  log('info', `Fetching online assets for DAR asset ${darAssetId} at ${url}`);
  const authToken = process.env.OAR_TOKEN ? `Bearer ${process.env.OAR_TOKEN}` : CONFIG.AUTH_TOKEN;
  const apiResponse = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: authToken,
    },
  });

  if (!apiResponse.ok) {
    log('error', `Failed to get online assets: ${apiResponse.status}. URL: ${url}`);
    return null;
  }

  const result = await apiResponse.json();
  const assets = Array.isArray(result) ? result : result ? [result] : [];
  log('info', `Successfully fetched ${assets.length} asset for record ${darAssetId} from OAR.`);
  return assets;
}

/**
 * Sends a POST request to the OAR API.
 * @param {CreateOARRequest} onlineAsset The online asset data to create
 * @returns The created OAR record, or null if the request fails
 */
export async function createOnlineAsset(darAssetId: string, url: string): Promise<OARResponse | null> {
  const onlineAsset = {
    darAssetId,
    darAssetType: 'external-dataset',
    sourceFiles: {
      usedSourceFiles: 'All' as const,
      sourceFileUrls: null,
    },
    onlineUrl: url,
    metadata: {
      geoserver: {
        layers: [],
        getCapabilitiesUrl: `${CONFIG.API_URL}/oar/online-assets/ows?service=WMS&version=1.3.0&request=GetCapabilities`,
      },
    },
    serviceType: 'geoserver',
    expectedLifetime: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years from now
  };

  const oarUrl = `${CONFIG.API_URL}/oar/online-assets`;
  log('info', `Posting asset for DAR record ${onlineAsset.darAssetId} to OAR: ${oarUrl}`);
  const authToken = process.env.OAR_TOKEN ? `Bearer ${process.env.OAR_TOKEN}` : CONFIG.AUTH_TOKEN;
  const apiResponse = await fetch(oarUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
    },
    body: JSON.stringify(onlineAsset),
  });

  if (!apiResponse) {
    log('error', `Posting for DAR record ${onlineAsset.darAssetId} to OAR: ${oarUrl} failed`);
    return null;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `Posting to ${oarUrl}: ${apiResponse.status}: ${responseText}`);
    return null;
  }

  const result = await apiResponse.json();
  log('info', `Successfully created OAR record: ${result.id}`);
  return result;
}

/**
 * Sends a DELETE request to OAR API.
 * @param {string} onlineAssetId The ID of the OAR record to delete
 * @returns True if successful, false otherwise
 */
export async function deleteOnlineAsset(onlineAssetId: string): Promise<boolean> {
  const url = `${CONFIG.API_URL}/oar/online-assets/${onlineAssetId}`;
  log('info', `Deleting online asset ${onlineAssetId} at ${url}`);

  const authToken = process.env.OAR_TOKEN ? `Bearer ${process.env.OAR_TOKEN}` : CONFIG.AUTH_TOKEN;
  const apiResponse = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: authToken,
    },
  });

  if (!apiResponse) {
    log('error', `Deleting of OAR record ${onlineAssetId} failed`);
    return false;
  }

  if (!apiResponse.ok) {
    const responseText = await apiResponse.text().catch(() => 'Could not read error response.');
    log('error', `Failed to delete online asset: ${apiResponse.status}: ${responseText}`);
    return false;
  }

  log('info', `Successfully deleted online asset with ID: ${onlineAssetId}`);
  return true;
}
