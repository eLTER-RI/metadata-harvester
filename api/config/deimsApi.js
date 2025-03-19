"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    schemaFile: '../schema/deims-schema.json',
    apiFile: '../../src/store/emptyDeimsApi.ts',
    apiImport: 'emptyDeimsApi',
    outputFile: '../../src/store/deimsApi.ts',
    exportName: 'deimsApi',
    hooks: true,
};
exports.default = config;
