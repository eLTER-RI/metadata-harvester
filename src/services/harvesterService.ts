import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import { log } from './serviceLogging';
import { RepositoryType } from '../store/commonStructure';
import { CONFIG } from '../../config';
import { harvestAndPost } from './harvester';
import { syncDeimsSites } from './syncDeimsSites';

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
  const repositoryType = repository.toUpperCase() as RepositoryType;

  if (!repository || !CONFIG.REPOSITORIES[repositoryType]) {
    return res.status(400).json({ error: `Invalid repository: '${repository}'.` });
  }

  try {
    await harvestAndPost(repositoryType);
    log('info', `Job for ${repositoryType} completed successfully.`);
  } catch (e) {
    log('error', `Job for ${repositoryType} failed with error: ${e}`);
  }
  res.status(200).json({ message: `Harvesting job completed.` });
});

app.post('/sync-deims', async (req, res) => {
  log('info', 'Command received: sync-deims');
  try {
    await syncDeimsSites(pool);
    res.status(200).json({ message: 'DEIMS sites synchronization started successfully.' });
  } catch (error) {
    log('error', `${error}`);
    res.status(500).json({ error: 'Failed to start DEIMS sites synchronization.' });
  }
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
