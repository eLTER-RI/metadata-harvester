import { log } from '../serviceLogging';
import { CONFIG } from '../../config/config';

export interface SourceFiles {
  usedSourceFiles: 'All' | 'Selected';
  sourceFileUrls?: string[] | null;
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
 * @param {string} darAssetType The DAR asset type
 * @returns Array of online assets, or null if the request fails
 */
export async function getOnlineAssets(
  darAssetId: string,
  darAssetType: string = 'external-dataset',
): Promise<OARResponse[] | null> {
  const oarApiUrl = `${CONFIG.API_URL}/oar/online-assets`;
  const url = `${oarApiUrl}?darAssetId=${encodeURIComponent(darAssetId)}&darAssetType=${encodeURIComponent(darAssetType)}`;
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
