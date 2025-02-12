#!/bin/bash

npx @rtk-query/codegen-openapi api/config/deimsApi.ts

input_file="api/schema/b2share-schema.json"
output_file="api/schema/b2share-extracted-schema.json"
jq '.json_schema' "$input_file" > "$output_file"
echo "json_schema extracted and saved as $output_file"
json2ts api/schema/b2share-extracted-schema.json -o ./src/store/b2shareApi.ts

wait
