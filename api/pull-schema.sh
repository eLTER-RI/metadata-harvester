#!/bin/bash

curl https://b2share.eudat.eu/api/communities/e9b9792e-79fb-4b07-b6b4-b9c2bd06d095/schemas/2#/json_schema -o api/schema/b2share-schema.json
curl https://deims.org/api | jq . > api/schema/deims-schema.json
