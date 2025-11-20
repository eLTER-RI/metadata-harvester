import 'dotenv/config';
import app from './app';
import { log } from './services/serviceLogging';
import pool from './db';

const PORT = process.env.PORT || 3000;

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
