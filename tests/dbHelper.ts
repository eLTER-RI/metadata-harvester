import { newDb, IMemoryDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';

export function setupInMemoryDb(): IMemoryDb {
  const db = newDb();
  const migrationsDir = path.join(process.cwd(), 'migrations');

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const migrationSQL = fs.readFileSync(filePath).toString();
    // executes migrations to the in-memory db
    db.public.none(migrationSQL);
  }

  return db;
}
