# Contributing to eLTER Data Harvester

## Adding a New Repository

Adding a new repository to harvest from requires several steps:

### 1. Add Repository Type

Add the new repository type to `backend/src/models/commonStructure.ts`:

```typescript
export type RepositoryType = 
  'B2SHARE_EUDAT' | 
  'SITES' | 
  'B2SHARE_JUELICH' | 
  'ZENODO' | 
  'ZENODO_IT' | 
  'DATAREGISTRY' |
  'NEW_REPOSITORY';  // add new type here
```

### 2. Create a Mapper

Create a new mapper file in `backend/src/mappers/` (e.g., `newRepositoryMapper.ts`). The mapper should:

- Export a function that maps the repository's data format to `CommonDataset`
- Handle site matching (using DEIMS sites)
- Handle record versioning (fetch latest version of record)
- Extract a cleanup metadata

### 3. Add Repository Configuration

Add the repository configuration to `backend/src/config/config.ts`:

**Configuration fields:**
- `apiUrl`: API URL listing all records records
- `pageSize`: If paginated, choose the pagesize, ideally based on the size of repository, and its limits.
- `selfLinkKey`: JSON path to the link for the record itself (e.g., `'links.self'`)
- `dataKey`: JSON path to array of records (e.g., `'hits.hits'`)
- `singleRecordKey`: Sometimes, the key to access when listing is different then for getting one record (response.resources vs response.resource). Use this field in such case, and follow the implementation for `DATAREGISTRY`.
- `processFunction`: Either `'processApiPage'` (JSON API) or `'processFieldSitesPage'` (XML/sitemap)
- `darQuery`: DAR API query to find existing records from this repository. Repositories use searching by `project`.

### 4. Add Mapping Logic

Add the mapping case in `backend/src/services/jobs/harvest/harvester.ts` in the `mapToCommonStructure` method:

```typescript
case 'NEW_REPOSITORY': {
  const matchedSites = await getNewRepositoryMatchedSites();
  mappedDataset = await mapNewRepositoryToCommonDatasetMetadata(
    sourceUrl, 
    recordData, 
    matchedSites
  );
  break;
}
```

### 5. Site Matching (Optional)

If your repository references sites, create a site matching function similar to existing ones:

```typescript
export async function getNewRepositoryMatchedSites(): Promise<any[]> {}
```
