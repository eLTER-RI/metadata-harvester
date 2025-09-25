import { RepositoryType } from '../../../store/commonStructure';
import { RecordDao } from '../../../store/dao/recordDao';
import { log } from '../../serviceLogging';

/**
 * CREATE or UPDATE of a record in the local database based on its existence and status of the synchronization.
 * It handles creating a new record, updating an old version of a record, or simply updating an existing record's status.
 * @param {string | null} darId The ID of the record in DAR. If set to null, it assumes record POST/PUT to dar was unsuccessful.
 * @param {boolean} missingInDb.
 * @param {RecordDao} recordDao
 * @param {string} sourceUrl The source URL of the record on the remote repository.
 * @param {RepositoryType} repositoryType The type of the repository (e.g., 'ZENODO', 'B2SHARE_EUDAT'...).
 * @param {string} sourceChecksum The checksum of the current source data.
 * @param {string} darChecksum Source data checksum.
 * @param {string} oldUrl (Optional) The old URL of the record if there is a new version but we have an older version with different sourceUrl.
 */
export async function dbRecordUpsert(
  darId: string | null,
  recordDao: RecordDao,
  sourceUrl: string,
  repositoryType: RepositoryType,
  sourceChecksum: string,
  darChecksum: string,
  title: string | null,
  oldUrl?: string,
) {
  const dbMatches = await recordDao.getRecordBySourceId(sourceUrl);
  const missingInDb = dbMatches.length === 0;
  if (!darId) {
    await recordDao.updateDarIdStatus(sourceUrl, {
      status: 'failed',
    });
    return;
  }

  if (missingInDb) {
    log('info', `Creating database record for ${sourceUrl}`);
    await recordDao.createRecord({
      source_url: sourceUrl,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: darId,
      dar_checksum: darChecksum,
      status: 'success',
      title: title,
    });
    return;
  }

  if (oldUrl) {
    log('info', `Record ${sourceUrl} has an old version of ${oldUrl} in DAR with ${darId}`);
    await recordDao.updateRecordWithPrimaryKey(oldUrl, {
      source_url: sourceUrl,
      source_repository: repositoryType,
      source_checksum: sourceChecksum,
      dar_id: darId,
      dar_checksum: darChecksum,
      status: 'updating',
      title: title,
    });
    return;
  }

  log('info', `Updating record in database for record ${sourceUrl}, dar id ${darId}`);
  await recordDao.updateRecord(sourceUrl, {
    source_url: sourceUrl,
    source_repository: repositoryType,
    source_checksum: sourceChecksum,
    dar_id: darId,
    dar_checksum: darChecksum,
    status: 'updating',
    title: title,
  });

  log('info', 'Record was up to date.');
  await recordDao.updateStatus(sourceUrl, {
    status: 'success',
  });
}
