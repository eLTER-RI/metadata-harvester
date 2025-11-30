import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { log } from './services/serviceLogging';
import { RepositoryType } from './models/commonStructure';
import { CONFIG } from './config/config';
import { HarvesterContext, startRecordSync, startRepositorySync } from './services/jobs/harvest/harvester';
import { syncDeimsSites } from './services/jobs/deimsSync/syncDeimsSites';
import { syncWithDar } from './services/jobs/syncDbWithRemote/localDarSync';
import { createRulesForRecord, deleteRuleForRecord, getRulesForRecord } from './services/rulesService';
import {
  listManualRecords,
  createManualRecord,
  updateManualRecord,
  deleteManualRecord,
} from './services/manualRecordsService';
import { createOnlineAsset, deleteOnlineAsset, getOnlineAssets } from './services/clients/oarApi';
import {
  listRecords,
  getRecordByDarId,
  updateRecordStatus,
  listRepositories,
  listResolvedCounts,
} from './services/recordsService';
import { getDeimsSites } from './services/deimsSitesService';
import { initializeScheduler } from './services/scheduler/jobScheduler';
import pool from './db';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

/**
 * @swagger
 * /api/records:
 *   get:
 *     tags: [Records]
 *     summary: Retrieve a paginated list of records
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer, default: 1 }
 *         description: The page number to retrieve.
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 10 }
 *         description: The number of records per page.
 *       - in: query
 *         name: resolved
 *         schema: { type: boolean }
 *         description: Filter by resolved status.
 *       - in: query
 *         name: repositories[]
 *         description: Filter by source repositories.
 *         schema: { type: array, items: { type: string } }
 *       - in: query
 *         name: title
 *         description: Search for records by title.
 *         schema: { type: string }
 *       - in: query
 *         name: sites
 *         description: Filter by site ID or site name (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: habitats
 *         description: Filter by habitat code (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: keywords
 *         description: Filter by keyword label (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: datasetTypes
 *         description: Filter by dataset type code (case-insensitive partial match).
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: A paginated list of records.
 *       500:
 *         description: Failed to retrieve records.
 */
app.get('/api/records', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const resolvedParam = req.query.resolved as string;
    const repositoryParam = req.query['repositories[]'] as string | string[];
    const titleParam = req.query.title as string;
    const sitesParam = req.query.sites as string;
    const habitatsParam = req.query.habitats as string;
    const keywordsParam = req.query.keywords as string;
    const datasetTypesParam = req.query.datasetTypes as string;
    const orderByParam = req.query.orderBy as string;
    const orderDirectionParam = req.query.orderDirection as string;
    let repositories: string[] | undefined;
    if (repositoryParam) {
      repositories = Array.isArray(repositoryParam) ? repositoryParam : [repositoryParam];
    }

    let orderBy: 'last_harvested' | 'last_seen_at' | 'status' = 'last_harvested';
    if (orderByParam === 'last_seen_at' || orderByParam === 'status') {
      orderBy = orderByParam;
    }

    const orderDirection = orderDirectionParam === 'asc' ? 'asc' : 'desc';

    const options = {
      resolved: resolvedParam ? resolvedParam === 'true' : undefined,
      repositories: repositories,
      title: titleParam,
      sites: sitesParam,
      habitats: habitatsParam,
      keywords: keywordsParam,
      datasetTypes: datasetTypesParam,
      size: size,
      offset: (page - 1) * size,
      orderBy: orderBy,
      orderDirection: orderDirection as 'asc' | 'desc',
    };

    const result = await listRecords(pool, options);

    if (!result.success) {
      log('error', `Failed to retrieve records: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json({
      records: result.records,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    });
  } catch (error) {
    log('error', `Failed to retrieve records: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve records.' });
  }
});

/**
 * @swagger
 * /api/repositories:
 *   get:
 *     tags: [Records]
 *     summary: Retrieve a list of repositories with the number of harvested records from each repository.
 *              This endpoint helps to update the filter.
 *     parameters:
 *       - in: query
 *         name: resolved
 *         schema: { type: boolean }
 *         description: Filter by resolved status.
 *       - in: query
 *         name: title
 *         description: Search for records by title.
 *         schema: { type: string }
 *       - in: query
 *         name: sites
 *         description: Filter by site ID or site name (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: habitats
 *         description: Filter by habitat code (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: keywords
 *         description: Filter by keyword label (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: datasetTypes
 *         description: Filter by dataset type code (case-insensitive partial match).
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: A list of repositories and the number of harvested records.
 *       500:
 *         description: Failed to retrieve repositories.
 */
app.get('/api/repositories', async (req, res) => {
  try {
    const resolvedParam = req.query.resolved as string;
    const titleParam = req.query.title as string;
    const sitesParam = req.query.sites as string;
    const habitatsParam = req.query.habitats as string;
    const keywordsParam = req.query.keywords as string;
    const datasetTypesParam = req.query.datasetTypes as string;
    const options = {
      resolved: resolvedParam ? resolvedParam === 'true' : undefined,
      title: titleParam,
      sites: sitesParam,
      habitats: habitatsParam,
      keywords: keywordsParam,
      datasetTypes: datasetTypesParam,
    };

    const result = await listRepositories(pool, options);

    if (!result.success) {
      log('error', `Failed to retrieve repositories: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json(result.repositories);
  } catch (error) {
    log('error', `Failed to retrieve repositories: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve repositories.' });
  }
});

/**
 * @swagger
 * /api/resolved:
 *   get:
 *     tags: [Records]
 *     summary: Get counts of resolved and unresolved records. This endpoint helps to update the filter.
 *     parameters:
 *       - in: query
 *         name: resolved
 *         schema: { type: boolean }
 *         description: Filter by resolved status.
 *       - in: query
 *         name: repositories[]
 *         description: Filter by source repositories.
 *         schema: { type: array, items: { type: string } }
 *       - in: query
 *         name: title
 *         description: Filter by record title.
 *         schema: { type: string }
 *       - in: query
 *         name: sites
 *         description: Filter by site ID or site name (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: habitats
 *         description: Filter by habitat code (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: keywords
 *         description: Filter by keyword label (case-insensitive partial match).
 *         schema: { type: string }
 *       - in: query
 *         name: datasetTypes
 *         description: Filter by dataset type code (case-insensitive partial match).
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Counts of resolved and unresolved records.
 *       500:
 *         description: Failed to retrieve counts.
 */
app.get('/api/resolved', async (req, res) => {
  try {
    const resolvedParam = req.query.resolved as string;
    const repositoryParam = req.query['repositories[]'] as string | string[];
    const titleParam = req.query.title as string;
    const sitesParam = req.query.sites as string;
    const habitatsParam = req.query.habitats as string;
    const keywordsParam = req.query.keywords as string;
    const datasetTypesParam = req.query.datasetTypes as string;
    let repositories: string[] | undefined;
    if (repositoryParam) {
      repositories = Array.isArray(repositoryParam) ? repositoryParam : [repositoryParam];
    }
    const options = {
      resolved: resolvedParam ? resolvedParam === 'true' : undefined,
      repositories: repositories,
      title: titleParam,
      sites: sitesParam,
      habitats: habitatsParam,
      keywords: keywordsParam,
      datasetTypes: datasetTypesParam,
    };

    const result = await listResolvedCounts(pool, options);

    if (!result.success) {
      log('error', `Failed to retrieve resolved/unresolved counts: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json(result.counts);
  } catch (error) {
    log('error', `Failed to retrieve resolved/unresolved counts: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve resolved/unresolved counts.' });
  }
});

/**
 * @swagger
 * /api/records/{darId}:
 *   get:
 *     tags: [Records]
 *     summary: Get a harvested record by DAR ID
 *     parameters:
 *       - in: path
 *         name: darId
 *         required: true
 *         schema: { type: string }
 *         description: The DAR ID of the record
 *     responses:
 *       200:
 *         description: The harvested record (has source_url)
 *       404:
 *         description: Record not found in harvested_records
 *       500:
 *         description: Failed to fetch record
 */
app.get('/api/records/:darId', async (req, res) => {
  try {
    const { darId } = req.params;

    const result = await getRecordByDarId(pool, darId);

    if (!result.success) {
      log('error', `Failed to fetch harvested record: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json(result.record);
  } catch (error) {
    log('error', `Failed to fetch harvested record: ${error}`);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to fetch harvested record: ${errorMessage}` });
  }
});

/**
 * @swagger
 * /api/records/{darId}/status:
 *   patch:
 *     tags: [Records]
 *     summary: Update the resolved status of a record.
 *     parameters:
 *       - in: path
 *         name: darId
 *         required: true
 *         schema:{ type: string }
 *         description: The dar id of the record to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [resolved, unresolved]
 *               resolvedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status successfully updated.
 *       500:
 *         description: Invalid input or missing fields.
 */
app.patch('/api/records/:darId/status', async (req, res) => {
  try {
    const { darId } = req.params;
    const { status, resolvedBy } = req.body;

    const result = await updateRecordStatus(pool, darId, status, resolvedBy);

    if (!result.success) {
      log('error', `Failed to update record status: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    log('error', `Failed to update record status: ${error}`);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to update record status: ${errorMessage}` });
  }
});

/**
 * @swagger
 * /api/records/{darId}/rules:
 *   get:
 *     tags: [Rules]
 *     summary: Get all rules for transformation of a record.
 *     parameters:
 *       - in: path
 *         name: darId
 *         required: true
 *         schema:{ type: string }
 *         description: The dar id of the record.
 *     responses:
 *       200:
 *         description: A list of rules.
 *       500:
 *         description: Failed to retrive rules.
 */
app.get('/api/records/:darId/rules', async (req, res) => {
  try {
    const { darId } = req.params;

    const result = await getRulesForRecord(pool, darId);

    if (!result.success) {
      log('error', `Failed to retrieve rules: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json(result.rules);
  } catch (error) {
    log('error', `Failed to retrieve rules: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve rules.' });
  }
});

/**
 * @swagger
 * /api/records/{darId}/rules:
 *   post:
 *     tags: [Rules]
 *     summary: Create rules for a record and trigger a re-harvest.
 *     parameters:
 *       - in: path
 *         name: darId
 *         required: true
 *         schema:{ type: string }
 *         description: The dar id of the record to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       201:
 *         description: Rules successfully created.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Record not found.
 *       500:
 *         description: Failed to create rules.
 */
app.post('/api/records/:darId/rules', async (req, res) => {
  try {
    const { darId } = req.params;
    const rulesData = req.body;

    const result = await createRulesForRecord(pool, darId, rulesData);

    if (!result.success) {
      log('error', `Failed to create rules: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    if (result.processedCount === 0) {
      return res.status(200).json({ message: result.message });
    }

    res.status(201).json({ message: result.message });
  } catch (error) {
    log('error', `Failed to create rules: ${error}`);
    res.status(500).json({ error: 'Failed to create rules.' });
  }
});

/**
 * @swagger
 * /api/records/{darId}/rules/{ruleId}:
 *   delete:
 *     tags: [Rules]
 *     summary: Delete a rule by its id.
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:{ type: string }
 *         description: The id of a rule to delete.
 *     responses:
 *       204:
 *         description: Rules successfully deleted.
 *       500:
 *         description: Failed to delete rule.
 */
app.delete('/api/records/:darId/rules/:ruleId', async (req, res) => {
  try {
    const { darId, ruleId } = req.params;

    const result = await deleteRuleForRecord(pool, darId, ruleId);

    if (!result.success) {
      log('error', `Failed to delete rule: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(204).send();
  } catch (error) {
    log('error', `Failed to delete rule: ${error}`);
    res.status(500).json({ error: 'Failed to delete rule.' });
  }
});

/**
 * @swagger
 * /api/harvest:
 *   post:
 *     tags: [Jobs]
 *     summary: Start a harvesting job for an entire repository.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repository:
 *                 type: string
 *                 example: ZENODO
 *               checkHarvestChanges:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Job started.
 *       400:
 *         description: Invalid input or repository not implemented.
 */
app.post('/api/harvest', async (req, res) => {
  const { repository, checkHarvestChanges = true } = req.body;
  if (!repository) {
    return res.status(400).json({ error: "Missing required field: 'repository'." });
  }

  if (typeof repository !== 'string') {
    return res.status(400).json({ error: "Invalid data type for 'repository'. Expected a string." });
  }

  // if changes to harvesting not expected, set to false
  // gives up effort of changes detection if source is not changed
  if (typeof checkHarvestChanges !== 'boolean') {
    return res.status(400).json({ error: "Invalid data type for 'checkHarvestChanges'. Expected a boolean." });
  }

  const repositoryType = repository.toUpperCase() as RepositoryType;

  if (!repository || !CONFIG.REPOSITORIES[repositoryType]) {
    return res.status(400).json({ error: `Invalid repository: '${repository}'.` });
  }

  // Run harvest asynchronously without blocking the response
  HarvesterContext.create(pool, repositoryType, checkHarvestChanges)
    .then((context) => {
      return startRepositorySync(context);
    })
    .then(() => {
      log('info', `Job for ${repositoryType} completed successfully.`);
    })
    .catch((e) => {
      log('error', `Job for ${repositoryType} failed with error: ${e}`);
    });
  res.status(200).json({ message: `Harvesting job started successfully.` });
});

/**
 * @swagger
 * /api/harvest/single:
 *   post:
 *     tags: [Jobs]
 *     summary: Start a harvesting job for one record.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceUrl:
 *                 type: string
 *                 example: b2share.eudat.eu/records/id
 *               repository:
 *                 type: string
 *                 example: ZENODO
 *               checkHarvestChanges:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Job started.
 *       400:
 *         description: Invalid input or missing fields.
 */
app.post('/api/harvest/single', async (req, res) => {
  const { sourceUrl, repository, checkHarvestChanges = true } = req.body;

  if (!sourceUrl || !repository) {
    return res.status(400).json({ error: "Missing required fields: 'sourceUrl' or 'repository'." });
  }

  // if changes to harvesting not expected, set to false
  // gives up effort of changes detection if source is not changed
  if (typeof checkHarvestChanges !== 'boolean') {
    return res.status(400).json({ error: "Invalid data type for 'checkHarvestChanges'. Expected a boolean." });
  }

  const repositoryType = repository.toUpperCase() as RepositoryType;

  if (!repository || !CONFIG.REPOSITORIES[repositoryType]) {
    return res.status(400).json({ error: `Invalid repository: '${repository}'.` });
  }

  // Run harvest asynchronously without blocking the response
  HarvesterContext.create(pool, repositoryType, checkHarvestChanges)
    .then((context) => {
      return startRecordSync(context, sourceUrl);
    })
    .then(() => {
      log('info', `Job for ${sourceUrl} completed successfully.`);
    })
    .catch((e) => {
      log('error', `Job for ${sourceUrl} failed with error: ${e}`);
    });
  res.status(200).json({ message: `Harvesting job started successfully.` });
});

/**
 * @swagger
 * /api/sync/sites:
 *   post:
 *     tags: [Jobs]
 *     summary: Synchronize sites from DEIMS.og.
 *     responses:
 *       200:
 *         description: Job started.
 *       400:
 *         description: Failed to start the job.
 */
app.post('/api/sync/sites', async (req, res) => {
  log('info', 'Command received: sync-deims');
  try {
    const syncPromise = syncDeimsSites(pool);
    syncPromise.catch((error) => {
      log('error', `DEIMS sites synchronization failed: ${error}`);
    });
    await Promise.race([
      syncPromise.catch((error) => {
        throw error;
      }),
      new Promise((resolve) => setTimeout(resolve, 0)),
    ]);
    res.status(200).json({ message: 'DEIMS sites synchronization started successfully.' });
  } catch (error) {
    log('error', `${error}`);
    res.status(500).json({ error: 'Failed to start DEIMS sites synchronization.' });
  }
});

/**
 * @swagger
 * /api/deims-sites:
 *   get:
 *     tags: [Sites]
 *     summary: Fetch all DEIMS sites from harvester database.
 *     responses:
 *       200:
 *         description: List of DEIMS sites.
 *       500:
 *         description: Failed to fetch DEIMS sites.
 */
app.get('/api/deims-sites', async (req, res) => {
  const result = await getDeimsSites(pool);

  if (!result.success) {
    log('error', `Failed to retrieve DEIMS sites: ${result.error}`);
    return res.status(result.statusCode || 500).json({ error: result.error });
  }

  res.status(200).json(result.sites || []);
});

/**
 * @swagger
 * /api/sync/records:
 *   post:
 *     tags: [Jobs]
 *     summary: Synchronize local database records with dar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repository:
 *                 type: string
 *                 example: ZENODO
 *               darCleanup:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Sync job started successfully.
 *       400:
 *         description: Invalid repository.
 */
app.post('/api/sync/records', async (req, res) => {
  const { repository, darCleanup = false } = req.body;
  let repositoryType = repository.toUpperCase() as RepositoryType;

  if (!repository || !CONFIG.REPOSITORIES[repositoryType]) {
    return res.status(400).json({ error: `Invalid repository: '${repository}'.` });
  }
  if (repositoryType === 'ZENODO_IT') {
    repositoryType = 'ZENODO';
  }
  syncWithDar(repositoryType, pool, darCleanup).catch((e) => {
    log('error', `Error during syncWithDar for ${repositoryType}: ${e}`);
  });
  res.status(200).json({ message: `Sync job of DAR with the local database started successfully.` });
});

/**
 * @swagger
 * /api/external-record/{darId}:
 *   get:
 *     tags: [DAR]
 *     summary: Proxy to fetch a record directly from the DAR API.
 *     parameters:
 *       - in: path
 *         name: darId
 *         required: true
 *         schema:{ type: string }
 *         description: The dar id of the record.
 *     responses:
 *       200:
 *         description: The external record data.
 *       500:
 *         description: Failed to fetch the record from DAR.
 */
app.get('/api/external-record/:darId', async (req, res) => {
  try {
    const { darId } = req.params;
    const externalApiUrl = `${CONFIG.API_URL}/external-datasets/${darId}`;
    const apiResponse = await fetch(externalApiUrl);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      log('error', `Failed to fetch data from DAR with id ${darId}: ${apiResponse.status} ${errorText}`);
      return res.status(apiResponse.status).json({ error: 'Failed to fetch external record.' });
    }

    const data = await apiResponse.json();
    res.status(200).json(data);
  } catch (error) {
    log('error', `Error while fetching external record: ${error}`);
    res.status(500).json({ error: 'Error while fetching external record.' });
  }
});

/**
 * @swagger
 * /api/manual-records:
 *   get:
 *     tags: [Manual Records]
 *     summary: Retrieve a paginated list of manual records
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer, default: 1 }
 *         description: The page number to retrieve.
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 10 }
 *         description: The number of records per page.
 *     responses:
 *       200:
 *         description: A paginated list of manual records.
 *       500:
 *         description: Failed to retrieve records.
 */
app.get('/api/manual-records', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const titleParam = req.query.title as string;

    const options = {
      size: size,
      offset: (page - 1) * size,
      title: titleParam,
    };

    const result = await listManualRecords(pool, options);

    if (!result.success) {
      log('error', `Failed to retrieve manual records: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json({
      records: result.records,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    });
  } catch (error) {
    log('error', `Failed to retrieve manual records: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve manual records.' });
  }
});

const server = app.listen(PORT, () => {
  log('info', `Data Harvester API listening at http://localhost:${PORT}`);
  // health check for db
  pool.query('SELECT 1').catch((e) => {
    log(
      'error',
      'Database connection failed. Ensure that Postgres is running, you have correct configuration, and environment variables.',
    );
    console.error(e);
  });
  initializeScheduler(pool);
});

/**
 * @swagger
 * /api/manual-records:
 *   post:
 *     tags: [Manual Records]
 *     summary: Create a new manual record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: The metadata for the record
 *     responses:
 *       201:
 *         description: Record created successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Failed to create record.
 */
app.post('/api/manual-records', async (req, res) => {
  try {
    const result = await createManualRecord(pool, req.body);

    if (!result.success) {
      log('error', `Failed to create manual record: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(201).json({
      id: result.id,
      dar_id: result.dar_id,
      message: result.message,
    });
  } catch (error) {
    log('error', `Error creating manual record: ${error}`);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to create manual record: ${errorMessage}` });
  }
});

/**
 * @swagger
 * /api/manual-records/{darId}:
 *   put:
 *     tags: [Manual Records]
 *     summary: Update a manual record in DAR
 *     parameters:
 *       - in: path
 *         name: darId
 *         required: true
 *         schema:
 *           type: string
 *         description: The dar id of the record to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: The full record data to send to DAR
 *     responses:
 *       200:
 *         description: Record updated successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Failed to update record.
 */
app.put('/api/manual-records/:darId', async (req, res) => {
  try {
    const { darId } = req.params;

    const result = await updateManualRecord(pool, darId, req.body);

    if (!result.success) {
      log('error', `Failed to update manual record: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json({
      id: result.id,
      dar_id: result.dar_id,
      message: result.message,
    });
  } catch (error) {
    log('error', `Error updating manual record: ${error}`);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to update manual record: ${errorMessage}` });
  }
});

/**
 * @swagger
 * /api/manual-records/{darId}:
 *   delete:
 *     tags: [Manual Records]
 *     summary: Delete a manual record from DAR and local database
 *     parameters:
 *       - in: path
 *         name: darId
 *         required: true
 *         schema:
 *           type: string
 *         description: The dar id of the record to delete
 *     responses:
 *       200:
 *         description: Record deleted successfully.
 *       404:
 *         description: Record not found.
 *       500:
 *         description: Failed to delete record.
 */
app.delete('/api/manual-records/:darId', async (req, res) => {
  try {
    const { darId } = req.params;

    const result = await deleteManualRecord(pool, darId);
    if (!result.success) {
      log('error', `Failed to delete manual record: ${result.error}`);
      return res.status(result.statusCode || 500).json({ error: result.error });
    }

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    log('error', `Error deleting manual record: ${error}`);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to delete manual record: ${errorMessage}` });
  }
});

/**
 * @swagger
 * /api/oar:
 *   post:
 *     tags: [OAR]
 *     summary: Create record in OAR for DAR record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: The online URL for the asset
 *               darAssetId:
 *                 type: string
 *                 description: The DAR asset ID (optional)
 *     responses:
 *       201:
 *         description: Online asset created successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Failed to create online asset.
 */
app.post('/api/oar', async (req, res) => {
  try {
    const { url, darAssetId: bodyDarAssetId } = req.body;
    const darAssetId = bodyDarAssetId || (req.query.darAssetId as string);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!darAssetId) {
      return res.status(400).json({ error: "Missing required field: 'darAssetId'." });
    }

    const result = await createOnlineAsset(darAssetId, url);
    if (!result) {
      return res.status(500).json({ error: 'Failed to create record in OAR' });
    }

    res.status(201).json(result);
  } catch (error) {
    log('error', `Failed to create record in OAR: ${error}`);
    res.status(500).json({ error: `Failed to create record in OAR: ${error}` });
  }
});

/**
 * @swagger
 * /api/oar:
 *   get:
 *     tags: [OAR]
 *     summary: Get OAR record for DAR record
 *     parameters:
 *       - in: query
 *         name: darAssetId
 *         required: true
 *         schema:
 *           type: string
 *         description: The DAR asset ID
 *     responses:
 *       200:
 *         description: List of online assets.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Failed to get online assets.
 */
app.get('/api/oar', async (req, res) => {
  try {
    const { darAssetId } = req.query;

    if (!darAssetId || typeof darAssetId !== 'string') {
      return res.status(400).json({ error: 'darAssetId is required' });
    }

    const assets = await getOnlineAssets(darAssetId);

    if (assets === null) {
      return res.status(500).json({ error: 'Failed to get online assets from OAR' });
    }

    res.status(200).json(assets);
  } catch (error) {
    log('error', `Failed to get online assets: ${error}`);
    res.status(500).json({ error: `Failed to get online assets: ${error}` });
  }
});

/**
 * @swagger
 * /api/oar/{onlineAssetId}:
 *   delete:
 *     tags: [OAR]
 *     summary: Delete an online asset from OAR
 *     parameters:
 *       - in: path
 *         name: onlineAssetId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the online asset to delete
 *     responses:
 *       200:
 *         description: Online asset deleted successfully.
 *       404:
 *         description: Online asset not found.
 *       500:
 *         description: Failed to delete online asset.
 */
app.delete('/api/oar/:onlineAssetId', async (req, res) => {
  try {
    const { onlineAssetId } = req.params;

    if (!onlineAssetId) {
      return res.status(400).json({ error: 'Online asset ID is required' });
    }

    const success = await deleteOnlineAsset(onlineAssetId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete online asset from OAR' });
    }

    res.status(200).json({ message: 'Online asset deleted successfully' });
  } catch (error) {
    log('error', `Failed to delete online asset: ${error}`);
    res.status(500).json({ error: `Failed to delete online asset: ${error}` });
  }
});

export { server };
export default app;
