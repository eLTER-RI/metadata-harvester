import 'dotenv/config';
import app from './app';
import { log } from './services/serviceLogging';
import pool from './db';
import { initializeScheduler } from './services/scheduler/jobScheduler';

const PORT = process.env.PORT || 3000;

let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    log('info', `Data Harvester API listening at http://localhost:${PORT}`);
    pool.query('SELECT 1').catch((e) => {
      log(
        'error',
        'Database connection failed. Ensure that Postgres is running, you have correct configuration, and environment variables.',
      );
      console.error(e);
    });
    initializeScheduler(pool);
  });
}

export { server };
