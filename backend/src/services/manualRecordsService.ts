import { Pool } from 'pg';
import { log } from './serviceLogging';
import { ManualRecordDao, DbManualRecord } from '../store/dao/manualRecordDao';
import { postToDarManual, putToDarManual, deleteDarRecordsByIds } from './clients/darApi';

export interface ListManualRecordsOptions {
  size?: number;
  offset?: number;
  title?: string;
}

export interface ListManualRecordsResult {
  success: boolean;
  records?: DbManualRecord[];
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  error?: string;
  statusCode?: number;
}

export interface CreateManualRecordResult {
  success: boolean;
  id?: number;
  dar_id?: string;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface UpdateManualRecordResult {
  success: boolean;
  id?: number;
  dar_id?: string;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface DeleteManualRecordResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Lists manual records with pagination and optional filtering.
 * @param {Pool} pool Database connection pool.
 * @param {ListManualRecordsOptions} options Pagination and filter options.
 * @returns {Promise<ListManualRecordsResult>} Result object.
 */
export async function listManualRecords(
  pool: Pool,
  options: ListManualRecordsOptions,
): Promise<ListManualRecordsResult> {
  const manualRecordDao = new ManualRecordDao(pool);
  const { records, totalCount } = await manualRecordDao.listRecords(options);

  const page =
    options.offset !== undefined && options.size !== undefined ? Math.floor(options.offset / options.size) + 1 : 1;
  const size = options.size || 10;

  return {
    success: true,
    records,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / size),
  };
}

/**
 * Validates manual record creation data.
 * @param {any} body Request body.
 * @returns {string | null} Error message.
 */
function validateCreateManualRecordData(body: any): string | null {
  if (!body.metadata) {
    return "Missing required field: 'metadata'.";
  }

  if (!body.metadata.assetType) {
    return "Missing required field: 'assetType'.";
  }

  return null;
}

/**
 * Creates a new manual record in DAR and local database.
 * @param {Pool} pool Database connection pool.
 * @param {any} recordData The record data to create.
 * @returns {Promise<CreateManualRecordResult>} Result object.
 */
export async function createManualRecord(pool: Pool, recordData: any): Promise<CreateManualRecordResult> {
  const validationError = validateCreateManualRecordData(recordData);
  if (validationError) {
    return {
      success: false,
      error: validationError,
      statusCode: 400,
    };
  }

  const { metadata } = recordData;
  const title = metadata.titles && metadata.titles.length > 0 ? metadata.titles[0].titleText : null;

  const darId = await postToDarManual(recordData);

  if (!darId) {
    log('error', `Failed to create manual record in DAR`);
    return {
      success: false,
      error: 'Failed to create record in DAR.',
      statusCode: 500,
    };
  }

  const manualRecordDao = new ManualRecordDao(pool);
  const dbRecord = await manualRecordDao.createRecord({
    dar_id: darId,
    title: title,
  });

  if (!dbRecord) {
    return {
      success: false,
      message: 'Failed to create manual record in database.',
    };
  }

  log('info', `Successfully created manual record with DAR ID: ${darId}`);

  return {
    success: true,
    id: dbRecord.id,
    dar_id: darId,
    message: 'Record created successfully in DAR.',
  };
}

/**
 * Updates a manual record in DAR and local database.
 * @param {Pool} pool Database connection pool.
 * @param {string} darId The DAR ID of the record to update.
 * @param {any} recordData The record data to update.
 * @returns {Promise<UpdateManualRecordResult>} Result object.
 */
export async function updateManualRecord(
  pool: Pool,
  darId: string,
  recordData: any,
): Promise<UpdateManualRecordResult> {
  const metadata = recordData.metadata || recordData;
  const title = metadata?.titles && metadata.titles.length > 0 ? metadata.titles[0].titleText : null;

  const success = await putToDarManual(darId, recordData);
  if (!success) {
    log('error', `Failed to manually update record ${darId} in DAR`);
    return {
      success: false,
      error: 'Failed to update record in DAR.',
      statusCode: 500,
    };
  }

  const manualRecordDao = new ManualRecordDao(pool);
  let manualRecord = await manualRecordDao.getRecordByDarId(darId);

  if (!manualRecord) {
    manualRecord = await manualRecordDao.createRecord({
      dar_id: darId,
      title: title,
    });
    if (!manualRecord) {
      return {
        success: false,
        message: 'Failed to create manual record in database.',
      };
    }
    log('info', `Registered existing dar record ${darId} to local database`);
  } else if (manualRecord.title !== title) {
    manualRecord = await manualRecordDao.updateTitle(darId, title);
    if (!manualRecord) {
      return {
        success: false,
        message: 'Failed to update manual record in database.',
      };
    }
    log('info', `Updated title for dar record ${darId} in local database`);
  }

  return {
    success: true,
    id: manualRecord.id,
    dar_id: darId,
    message: 'Record updated successfully in DAR.',
  };
}

/**
 * Deletes a manual record from DAR and local database.
 * @param {Pool} pool Database connection pool.
 * @param {string} darId The DAR ID of the record to delete.
 * @returns {Promise<DeleteManualRecordResult>} Result object.
 */
export async function deleteManualRecord(pool: Pool, darId: string): Promise<DeleteManualRecordResult> {
  const manualRecordDao = new ManualRecordDao(pool);
  const manualRecord = await manualRecordDao.getRecordByDarId(darId);

  if (!manualRecord) {
    return {
      success: false,
      error: `Manual record with dar id ${darId} not found`,
      statusCode: 404,
    };
  }

  try {
    await deleteDarRecordsByIds([darId]);
    log('info', `Successfully deleted record ${darId} from DAR`);

    await manualRecordDao.deleteRecord(manualRecord.id);
    log('info', `Successfully deleted manual record ${darId} from local database`);

    return {
      success: true,
      message: 'Record deleted successfully from both DAR and local database.',
    };
  } catch (error) {
    log('error', `Error deleting manual record ${darId}: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete record',
      statusCode: 500,
    };
  }
}
