#!/bin/bash

cd /home/ec2-user/app || exit
npm ci >outputInstall.log

source .env

export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
export AWS_PAGER=""

ENV=$(cat /home/ec2-user/env)

# GET SECTRETS
Secrets=$(aws secretsmanager get-secret-value --secret-id ${AWS_SECRETS} --cli-connect-timeout 1)
Urls=$(echo ${Secrets} | jq .SecretString | jq -rc . | jq -rc '.Urls')
Project=$(echo ${Secrets} | jq .SecretString | jq -rc . | jq -rc '.Project')

aws s3 cp ${Urls} ./urls.json
AppUrl=$(cat urls.json | jq ".app.${ENV}" | tr -d '"')
CpUlr=$(cat urls.json | jq ".cp.${ENV}" | tr -d '"')
AuthUrl=$(cat urls.json | jq ".auth.${ENV}" | tr -d '"')

echo "AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}" >>.env.${ENV}
echo "Target=${Target}" >>.env.${ENV}
echo "Project=${Project}" >>.env.${ENV}

echo "APP_URL=${AppUrl}" >>.env.${ENV}
echo "APP_CORS_ORIGIN=https://${AppUrl}" >>.env.${ENV}
echo "CP_URL=${CpUlr}" >>.env.${ENV}
echo "CP_CORS_ORIGIN=https://${CpUlr}" >>.env.${ENV}

CognitoDomainUrl=$(aws cognito-idp describe-user-pool-domain --domain ${AuthUrl} | jq -r '.DomainDescription.Domain')
CognitoUserPoolID=$(aws cognito-idp describe-user-pool-domain --domain ${AuthUrl} | jq -r '.DomainDescription.UserPoolId')
CognitoAppClientID=$(aws cognito-idp list-user-pool-clients --user-pool-id ${CognitoUserPoolID} | jq -r '.UserPoolClients[].ClientId')

echo "AWS_COGNITO_URL=${CognitoDomainUrl}" >>.env.${ENV}
echo "AWS_COGNITO_USER_POOL_ID=${CognitoUserPoolID}" >>.env.${ENV}
echo "AWS_COGNITO_CLIENT_ID=${CognitoAppClientID}" >>.env.${ENV}

cp .env.${ENV} .env
find ./ -maxdepth 1 -name '.env.*' -exec rm {} \;
