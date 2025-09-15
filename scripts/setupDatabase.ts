import { Client } from 'pg';
import 'dotenv/config';

async function checkAndCreateDb(dbName: string): Promise<void> {
  process.stdout.write(`Checking if db exists: ` + dbName + '\n');

  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  });

  try {
    await client.connect();

    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const checkDbResult = await client.query(checkDbQuery, [dbName]);

    if (checkDbResult.rowCount === 0) {
      process.stdout.write(`Database '${dbName}' not found. Creating.\n`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      process.stdout.write(`Successfully created database '${dbName}'.\n`);
    } else {
      process.stdout.write(`Database '${dbName}' already exists. Skipping creation.\n`);
    }
  } catch (error) {
    process.stderr.write('Error during database creation: ' + error + '\n');
    throw error;
  } finally {
    await client.end();
  }
}

async function init(): Promise<void> {
  const dbName = process.env.DB_NAME;
  if (!dbName) {
    process.stderr.write('DB_NAME env not set.\n');
    throw new Error('DB_NAME env not set.');
  }

  await checkAndCreateDb(dbName);

  const appClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  });
  try {
    process.stdout.write(`Creating tables: \n`);
    await appClient.connect();
    const allTablesCreate = `
      CREATE TABLE IF NOT EXISTS harvested_records (
        source_url TEXT PRIMARY KEY,
        source_repository TEXT NOT NULL,
        source_checksum TEXT NOT NULL,
        dar_id TEXT,
        dar_checksum TEXT,
        status TEXT,
        last_harvested TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deims_sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        shortname TEXT,
        site_data JSONB NOT NULL,
        checksum TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS record_rules (
        id SERIAL PRIMARY KEY,
        dar_id VARCHAR(255) NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        target_path VARCHAR(255) NOT NULL,
        new_value JSONB,
        FOREIGN KEY (dar_id) REFERENCES harvested_records(dar_id)
      );

      CREATE TABLE IF NOT EXISTS mapping_rules (
        id SERIAL PRIMARY KEY,
        repository_type VARCHAR(50) NOT NULL,
        source_path TEXT NOT NULL,
        target_path TEXT NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        options JSONB,
        condition JSONB
      );
  `;
    await appClient.query(allTablesCreate);
    process.stdout.write(`Successfully created all tables.\n`);
  } catch (error) {
    process.stderr.write('Error during table creationg: ' + error + '\n');
    throw error;
  } finally {
    appClient.end();
  }
}

init();

export default init;
