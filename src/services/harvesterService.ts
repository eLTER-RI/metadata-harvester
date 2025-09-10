import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import { log } from './serviceLogging';
import { RepositoryType } from '../store/commonStructure';
import { CONFIG } from '../../config';
import { startRepositorySync } from './harvester';
import { syncDeimsSites } from './syncDeimsSites';
import { syncWithDar } from '../../scripts/localDarSync';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/harvest', async (req, res) => {
  const { repository } = req.body;
  if (!repository) {
    return res.status(400).json({ error: "Missing required field: 'repository'." });
  }

  if (typeof repository !== 'string') {
    return res.status(400).json({ error: "Invalid data type for 'repository'. Expected a string." });
  }

  const repositoryType = repository.toUpperCase() as RepositoryType;

  if (!repository || !CONFIG.REPOSITORIES[repositoryType]) {
    return res.status(400).json({ error: `Invalid repository: '${repository}'.` });
  }

  try {
    await startRepositorySync(pool, repositoryType);
    log('info', `Job for ${repositoryType} completed successfully.`);
  } catch (e) {
    log('error', `Job for ${repositoryType} failed with error: ${e}`);
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
