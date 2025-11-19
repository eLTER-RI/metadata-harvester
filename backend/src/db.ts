import { Pool } from 'pg';

const currentEnv = process.env.NODE_ENV;

function getDatabaseName(): string {
  if (currentEnv === 'dev') {
    return 'data_harvester_dev';
  }

  if (process.env.DB_NAME) {
    return process.env.DB_NAME;
  }

  return process.env.DB_NAME || 'data_harvester';
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: getDatabaseName(),
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

export default pool;
