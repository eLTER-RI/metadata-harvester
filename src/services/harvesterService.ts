import 'dotenv/config';
import express from 'express';
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

const PORT = process.env.PORT || 3000;

app.get('/records', async (req, res) => {
  try {
    const recordDao = new RecordDao(pool);
    const repository = req.query.repository as RepositoryType;

    let records;
    if (repository) {
      records = await recordDao.listRecordsByRepository(repository);
    } else {
      records = await recordDao.listRecords();
    }

    res.status(200).json(records);
  } catch (error) {
    log('error', `Failed to retrieve records: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve records.' });
  }
});

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

app.post('/harvest', async (req, res) => {
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

app.post('/harvest/single', async (req, res) => {
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

app.post('/sync/sites', async (req, res) => {
  log('info', 'Command received: sync-deims');
  try {
    await syncDeimsSites(pool);
    res.status(200).json({ message: 'DEIMS sites synchronization started successfully.' });
  } catch (error) {
    log('error', `${error}`);
    res.status(500).json({ error: 'Failed to start DEIMS sites synchronization.' });
  }
});

app.post('/sync/records', async (req, res) => {
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

app.listen(PORT, () => {
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
