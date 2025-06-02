#!/bin/bash

curl https://b2share.eudat.eu/api/communities/d952913c-451e-4b5c-817e-d578dc8a4469/schemas/2#/json_schema -o api/schema/b2share-schema.json
curl https://deims.org/api | jq . > api/schema/deims-schema.json
