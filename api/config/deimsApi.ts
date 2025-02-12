import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
  schemaFile: '../schema/deims-schema.json',
  apiFile: '../../src/store/emptyDeimsApi.ts',
  apiImport: 'emptyDeimsApi',
  outputFile: '../../src/store/deimsApi.ts',
  exportName: 'deimsApi',
  hooks: true,
}

export default config

