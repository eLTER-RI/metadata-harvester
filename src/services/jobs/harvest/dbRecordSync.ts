import { RepositoryType, CommonDataset } from '../../../store/commonStructure';
import { RecordDao } from '../../../store/dao/recordDao';
import { log } from '../../serviceLogging';

/**
 * CREATE or UPDATE of a record in the local database based on its existence and status of the synchronization.
 * It handles creating a new record, updating an old version of a record, or simply updating an existing record's status.
 * @param {string | null} darId The ID of the record in DAR. If set to null, it assumes record POST/PUT to dar was unsuccessful.
 * @param {RecordDao} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {RepositoryType} repositoryType The type of the repository (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 * @param {string} sourceChecksum The checksum of the current source data.
 * @param {string} darChecksum Source data checksum.
 * @param {CommonDataset} dataset The dataset metadata to extract fields from.
 * @param {string} oldUrl (Optional) The old URL of the record if there is a new version but we have an older version with different sourceUrl.
 */
export async function dbRecordUpsert(
  darId: string | null,
  recordDao: RecordDao,
  sourceUrl: string,
  repositoryType: RepositoryType,
  sourceChecksum: string,
  darChecksum: string,
  dataset?: CommonDataset,
  oldUrl?: string,
) {
  if (!darId) {
    await recordDao.updateDarIdStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  try {
    const title =
      dataset?.metadata?.titles && dataset.metadata.titles.length > 0 ? dataset.metadata.titles[0].titleText : null;
    const siteReferences = dataset?.metadata?.siteReferences || [];
    const habitatReferences = dataset?.metadata?.habitatReferences || [];
    const datasetType = dataset?.metadata?.datasetType || null;
    const keywords = dataset?.metadata?.keywords || [];

    const recordPayload = {
      source_url: sourceUrl,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: darId,
      dar_checksum: darChecksum,
      status: 'success',
      title: title,
      site_references: siteReferences,
      habitat_references: habitatReferences,
      dataset_type: datasetType,
      keywords: keywords,
    };

    if (oldUrl) {
      log('info', `Record ${sourceUrl} has an old version of ${oldUrl} in DAR with ${darId}`);
      await recordDao.updateRecordWithPrimaryKey(oldUrl, recordPayload);
      return;
    }

    const dbMatches = await recordDao.getRecordBySourceId(sourceUrl);
    if (dbMatches.length === 0) {
      log('info', `Creating database record for ${sourceUrl}`);
      await recordDao.createRecord(recordPayload);
      log('info', `Successfully created record: ${sourceUrl}`);
    } else {
      log('info', `Updating record in database for record ${sourceUrl}, dar id ${darId}`);
      await recordDao.updateRecord(sourceUrl, recordPayload);
      log('info', `Successfully updated record: ${sourceUrl}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    log('error', `Failed to upsert record for ${sourceUrl}. Reason: ${errorMessage}`);
    await recordDao.updateDarIdStatus(sourceUrl, {
      status: 'failed',
    });
  }
}
