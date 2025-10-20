import 'dotenv/config';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import { Pool } from 'pg';
import { log } from './serviceLogging';
import { RepositoryType } from '../store/commonStructure';
import { CONFIG } from '../../config';
import { HarvesterContext, startRecordSync, startRepositorySync } from './jobs/harvest/harvester';
import { syncDeimsSites } from './jobs/deimsSync/syncDeimsSites';
import { syncWithDar } from './jobs/syncDbWithRemote/localDarSync';
import { RecordDao } from '../store/dao/recordDao';
import { ResolvedRecordDao } from '../store/dao/resolvedRecordsDao';
import { RuleDao } from '../store/dao/rulesDao';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Data Harvester API',
      version: '1.0.0',
      description: 'API for managing records, rules, and background harvesting jobs.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ['./src/services/harvesterService.ts'],
};

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const app = express();
app.use(express.json());
app.use(cors());
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
 *     responses:
 *       200:
 *         description: A paginated list of records.
 *       500:
 *         description: Failed to retrieve records.
 */
app.get('/api/records', async (req, res) => {
  try {
    const recordDao = new RecordDao(pool);
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const resolvedParam = req.query.resolved as string;
    const repositoryParam = req.query['repositories[]'] as string | string[];
    const titleParam = req.query.title as string;
    let repositories: string[] | undefined;
    if (repositoryParam) {
      repositories = Array.isArray(repositoryParam) ? repositoryParam : [repositoryParam];
    }
    const options = {
      resolved: resolvedParam ? resolvedParam === 'true' : undefined,
      repositories: repositories,
      title: titleParam,
      size: size,
      offset: (page - 1) * size,
    };

    const { records, totalCount } = await recordDao.listRecords(options);
    res.status(200).json({
      records: records,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / size),
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
    const options = {
      resolved: resolvedParam ? resolvedParam === 'true' : undefined,
      title: titleParam,
    };
    const recordDao = new RecordDao(pool);
    const repositoriesWithCount = await recordDao.listRepositoriesWithCount(options);

    res.status(200).json(repositoriesWithCount);
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
    let repositories: string[] | undefined;
    if (repositoryParam) {
      repositories = Array.isArray(repositoryParam) ? repositoryParam : [repositoryParam];
    }
    const options = {
      resolved: resolvedParam ? resolvedParam === 'true' : undefined,
      repositories: repositories,
      title: titleParam,
    };
    const resolvedDao = new ResolvedRecordDao(pool);
    const resolvedsWithCount = await resolvedDao.listResolvedUnresolvedCount(options);
    res.status(200).json(resolvedsWithCount);
  } catch (error) {
    log('error', `Failed to retrieve resolved/unresolved counts: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve resolved/unresolved counts.' });
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
  const darId = req.params.darId as string;
  const { status, resolvedBy } = req.body;

  if (!darId || !status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const resolvedRecordDao = new ResolvedRecordDao(pool);
  if (status === 'resolved') {
    await resolvedRecordDao.create(darId, resolvedBy);
    res.status(200).json({ message: 'Status updated successfully.' });
  } else if (status === 'unresolved') {
    await resolvedRecordDao.delete(darId);
    res.status(200).json({ message: 'Status updated successfully.' });
  } else {
    return res.status(400).json({ error: "Invalid status value. Status must be 'resolved' or 'unresolved'." });
  }
});

/**
 * @swagger
 * /api/records/{darId}/rules:
 *   patch:
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
    const ruleDao = new RuleDao(pool);
    const rules = await ruleDao.getRulesForRecord(darId);
    res.status(200).json(rules);
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

    if (!Array.isArray(rulesData)) {
      return res.status(400).json({ error: 'Invalid rules data. Expected an array.' });
    }

    const recordDao = new RecordDao(pool);
    const record = await recordDao.getRecordByDarId(darId);
    if (!record || !record?.source_url || !record?.source_repository) {
      return res.status(404).json({ error: `Record with dar id ${darId}. not found` });
    }

    const ruleDao = new RuleDao(pool);
    await ruleDao.createRules(darId, rulesData);
    log('info', `${rulesData.length} rules created for ${darId}. Triggering single record re-harvest.`);
    const repositoryType = record.source_repository.toUpperCase() as RepositoryType;
    const context = await HarvesterContext.create(pool, repositoryType, false);
    try {
      await startRecordSync(context, record.source_url);
      log('info', `Re-harvest job for ${record.source_url} completed successfully.`);
    } catch (e) {
      log('error', `Re-harvest job for ${record.source_url} failed with error: ${e}`);
    }
    res.status(201).json({ message: `${rulesData.length} rules created successfully.` });
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
    const { ruleId } = req.params;
    const ruleDao = new RuleDao(pool);
    await ruleDao.deleteRule(ruleId);
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
    return res.status(400).json({ error: "Invalid data type for 'rewriteAll'. Expected a boolean." });
  }

  const repositoryType = repository.toUpperCase() as RepositoryType;

  if (!repository || !CONFIG.REPOSITORIES[repositoryType]) {
    return res.status(400).json({ error: `Invalid repository: '${repository}'.` });
  }

  const context = await HarvesterContext.create(pool, repositoryType, checkHarvestChanges);
  try {
    await startRepositorySync(context);
    log('info', `Job for ${repositoryType} completed successfully.`);
  } catch (e) {
    log('error', `Job for ${repositoryType} failed with error: ${e}`);
  }
  res.status(200).json({ message: `Harvesting job completed.` });
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
    return res.status(400).json({ error: "Missing required fields: 'source_url' and 'repository'." });
  }

  // if changes to harvesting not expected, set to false
  // gives up effort of changes detection if source is not changed
  if (typeof checkHarvestChanges !== 'boolean') {
    return res.status(400).json({ error: "Invalid data type for 'rewriteAll'. Expected a boolean." });
  }

  const repositoryType = repository.toUpperCase() as RepositoryType;

  if (!repository || !CONFIG.REPOSITORIES[repositoryType]) {
    return res.status(400).json({ error: `Invalid repository: '${repository}'.` });
  }

  const context = await HarvesterContext.create(pool, repositoryType, checkHarvestChanges);
  try {
    await startRecordSync(context, sourceUrl);
    log('info', `Job for ${sourceUrl} completed successfully.`);
  } catch (e) {
    log('error', `Job for ${sourceUrl} failed with error: ${e}`);
  }
  res.status(200).json({ message: `Harvesting job completed.` });
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
    await syncDeimsSites(pool);
    res.status(200).json({ message: 'DEIMS sites synchronization started successfully.' });
  } catch (error) {
    log('error', `${error}`);
    res.status(500).json({ error: 'Failed to start DEIMS sites synchronization.' });
  }
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
  await syncWithDar(repositoryType, pool, darCleanup).catch((e) => {
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
    const externalApiUrl = `https://dar.elter-ri.eu/api/external-datasets/${darId}`;
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
});

export { server };
export default app;
