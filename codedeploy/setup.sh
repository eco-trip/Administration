#!/bin/bash

cd /home/ec2-user/app || exit
npm ci >outputInstall.log

source .env
ENV=$(cat /home/ec2-user/env)

aws s3 cp ${urls} ./urls.json
AppUrl=$(cat urls.json | jq ".app.${ENV}" | tr -d '"')
CpUlr=$(cat urls.json | jq ".cp.${ENV}" | tr -d '"')

echo "AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}" >>.env.${ENV}
echo "project=${project}" >>.env.${ENV}
echo "target=${target}" >>.env.${ENV}

echo "APP_URL=${AppUrl}" >>.env.${ENV}
echo "APP_CORS_ORIGIN=https://${AppUrl}" >>.env.${ENV}
echo "CP_URL=${CpUlr}" >>.env.${ENV}
echo "CP_CORS_ORIGIN=https://${CpUlr}" >>.env.${ENV}

cp .env.${ENV} .env
find ./ -maxdepth 1 -name '.env.*' -exec rm {} \;
