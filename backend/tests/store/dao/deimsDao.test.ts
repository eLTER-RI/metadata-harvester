import { IMemoryDb } from 'pg-mem';
import { DeimsDao, DeimsSiteDbRecord } from '../../../src/store/dao/deimsDao';
import { setupInMemoryDb } from '../../dbHelper';

describe('Tests for DeimsDao', () => {
  let db: IMemoryDb;
  let deimsDao: DeimsDao;
  let backup: any;

  beforeEach(() => {
    db = setupInMemoryDb();
    backup = db.backup();

    const pool = new (db.adapters.createPg().Pool)();
    deimsDao = new DeimsDao(pool as any);
  });

  afterEach(() => {
    backup.restore(); // ensure clean state
  });

  it('creates and retrieves a site', async () => {
    const siteData = {
      id: { suffix: 'site-123' },
      title: 'Test Site',
      shortName: 'TS',
    };

    const newSite: DeimsSiteDbRecord = {
      id: 'site-123',
      name: 'Test Site',
      shortname: 'TS',
      site_data: siteData,
      checksum: 'checksum123',
    };

    await deimsDao.upsertSite(newSite);
    const sites = await deimsDao.getSitesForLookup();

    expect(sites).toHaveLength(1);
    expect(sites[0].siteID).toBe('site-123');
    expect(sites[0].siteName).toBe('Test Site');
    expect(sites[0].siteData).toEqual(siteData);
  });

  it('returns empty array when no sites exist', async () => {
    const sites = await deimsDao.getSitesForLookup();
    expect(sites).toHaveLength(0);
    expect(Array.isArray(sites)).toBe(true);
  });
});
