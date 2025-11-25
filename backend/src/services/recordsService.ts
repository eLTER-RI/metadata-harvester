import { Pool } from 'pg';
import { RecordDao, DbRecord } from '../store/dao/recordDao';
import { ResolvedRecordDao } from '../store/dao/resolvedRecordsDao';

export interface ListRecordsOptions {
  resolved?: boolean;
  repositories?: string[];
  title?: string;
  sites?: string;
  habitats?: string;
  keywords?: string;
  datasetTypes?: string;
  size?: number;
  offset?: number;
}

export interface ListRecordsResult {
  success: boolean;
  records?: DbRecord[];
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  error?: string;
  statusCode?: number;
}

export interface GetRecordResult {
  success: boolean;
  record?: DbRecord;
  error?: string;
  statusCode?: number;
}

export interface UpdateRecordStatusResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ListRepositoriesOptions {
  resolved?: boolean;
  title?: string;
  sites?: string;
  habitats?: string;
  keywords?: string;
  datasetTypes?: string;
}

export interface ListRepositoriesResult {
  success: boolean;
  repositories?: { source_repository: string; count: number }[];
  error?: string;
  statusCode?: number;
}

export interface ListResolvedCountOptions {
  resolved?: boolean;
  repositories?: string[];
  title?: string;
  sites?: string;
  habitats?: string;
  keywords?: string;
  datasetTypes?: string;
}

export interface ListResolvedCountResult {
  success: boolean;
  counts?: { resolved: boolean; count: number }[];
  error?: string;
  statusCode?: number;
}

/**
 * Lists records with pagination and optional filtering.
 * @param {Pool} pool Database connection pool.
 * @param {ListRecordsOptions} options Pagination and filter options.
 * @returns {Promise<ListRecordsResult>} Result object.
 */
export async function listRecords(pool: Pool, options: ListRecordsOptions): Promise<ListRecordsResult> {
  const recordDao = new RecordDao(pool);
  const { records, totalCount } = await recordDao.listRecords(options);

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
 * Gets a single record by DAR ID.
 * @param {Pool} pool Database connection pool.
 * @param {string} darId The DAR ID of the record.
 * @returns {Promise<GetRecordResult>} Result object.
 */
export async function getRecordByDarId(pool: Pool, darId: string): Promise<GetRecordResult> {
  const recordDao = new RecordDao(pool);
  const record = await recordDao.getRecordByDarId(darId);

  if (!record) {
    return {
      success: false,
      error: 'Record not found in harvested_records',
      statusCode: 404,
    };
  }

  return {
    success: true,
    record,
  };
}

/**
 * Validates update status request data.
 * @param {string} darId The DAR ID.
 * @param {any} body Request body.
 * @returns {string | null} Error message for failed validation.
 */
function validateUpdateStatusData(darId: string, body: any): string | null {
  if (!darId || !body.status) {
    return 'Missing required fields.';
  }

  if (body.status !== 'resolved' && body.status !== 'unresolved') {
    return "Invalid status value. Status must be 'resolved' or 'unresolved'.";
  }

  return null;
}

/**
 * Updates the resolved status of a record.
 * @param {Pool} pool Database connection pool.
 * @param {string} darId The DAR ID of the record.
 * @param {string} status The new status ('resolved' or 'unresolved').
 * @param {string} resolvedBy Optional user who resolved the record.
 * @returns {Promise<UpdateRecordStatusResult>} Result object.
 */
export async function updateRecordStatus(
  pool: Pool,
  darId: string,
  status: string,
  resolvedBy?: string,
): Promise<UpdateRecordStatusResult> {
  const validationError = validateUpdateStatusData(darId, { status });
  if (validationError) {
    return {
      success: false,
      error: validationError,
      statusCode: 400,
    };
  }

  const resolvedRecordDao = new ResolvedRecordDao(pool);
  if (status === 'resolved') {
    await resolvedRecordDao.create(darId, resolvedBy || '');
  } else if (status === 'unresolved') {
    await resolvedRecordDao.delete(darId);
  }

  return {
    success: true,
    message: 'Status updated successfully.',
  };
}

/**
 * Lists repositories with record counts.
 * @param {Pool} pool Database connection pool.
 * @param {ListRepositoriesOptions} options Filter options.
 * @returns {Promise<ListRepositoriesResult>} Result object.
 */
export async function listRepositories(pool: Pool, options: ListRepositoriesOptions): Promise<ListRepositoriesResult> {
  const recordDao = new RecordDao(pool);
  const repositoriesWithCount = await recordDao.listRepositoriesWithCount(options);

  return {
    success: true,
    repositories: repositoriesWithCount,
  };
}

/**
 * Lists resolved and unresolved record counts.
 * @param {Pool} pool Database connection pool.
 * @param {ListResolvedCountOptions} options Filtering options.
 * @returns {Promise<ListResolvedCountResult>} Result object.
 */
export async function listResolvedCounts(
  pool: Pool,
  options: ListResolvedCountOptions,
): Promise<ListResolvedCountResult> {
  const resolvedDao = new ResolvedRecordDao(pool);
  const counts = await resolvedDao.listResolvedUnresolvedCount(options);

  return {
    success: true,
    counts,
  };
}
