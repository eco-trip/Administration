#!/bin/bash

read -p "Destroy everything? [y/N]" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit
fi

source ../.env
echo

rootFolder=$(dirname $(pwd))
gitUsername=$(echo $(git config user.name) | tr '[:upper:]' '[:lower:]')

while getopts ":he:p:a:g:s:d:" opt; do
  case $opt in
  h)
    echo "This script destories the cloud structure.
    Flags:
      -e  Specify the env [dev, production, staging]
      -p  Specify the project name
      -a  Specify the aws profile to use
      -g  Specify the creator of the resource [default git username]
      -s  Specify the subdomain
      -d  Specify the domain"
    exit
    ;;
  e)
    env="$OPTARG"
    ;;
  p)
    projectName="$OPTARG"
    ;;
  a)
    AWS_PROFILE="$OPTARG"
    ;;
  g)
    gitUsername="$OPTARG"
    ;;
  s)
    subdomain="$OPTARG"
    ;;
  d)
    domain="$OPTARG"
    ;;
  \?)
    echo "Invalid option: -$OPTARG"
    ;;
  esac
done

if [ "$env" = "" ]; then
  echo "No env specified, use -e to select the environment"
  exit
fi

if [ "$projectName" = "" ]; then
  echo "Specify the project name with the -p flag"
  exit
fi

if [ "$env" = "production" ]; then
  read -p "Are you sure? " -n 1 -r
  echo
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    [[ "$0" = "$BASH_SOURCE" ]] && exit 1 || return 1 # handle exits from shell or function but don't exit interactive shell
  fi
fi

export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
export AWS_PAGER=""

if [ $env = "dev" ]; then
  URI="${projectName}"-"${env}"-"${gitUsername}"-"${subdomain}"-api
else
  URI="${projectName}"-"${env}"-"${subdomain}"-api
fi

aws s3 cp $urls ./urls.json
ApiUrl=$(cat urls.json | jq ".api.${env}" | tr -d '"')

aws s3 rm s3://"${URI}" --recursive 2>/dev/null || echo "S3 bucket not found, probably already deleted"
aws s3 rb s3://"${URI}" --force 2>/dev/null || echo "S3 bucket not found, probably already deleted"
aws ec2 delete-key-pair --key-name "${URI}"-keys 2>/dev/null || echo "Key pair not found, probably already deleted"

ClusterName=$(echo $URI | tr -d "-")
secretName=$(aws secretsmanager list-secrets --query "SecretList[?Description=='MongoDB Atlas Quickstart Deployment Secret'].Name" --output json --cli-connect-timeout 1 | jq ".[] | select(test(\"$ClusterName\"))" | tr -d '"')
aws secretsmanager delete-secret --secret-id $secretName --force-delete-without-recovery
DatabaseUser=$(aws cloudformation describe-stacks --stack-name ${URI} --query "Stacks[0].Outputs[?OutputKey=='DatabaseUser'].OutputValue" --output text)
secret=$(aws secretsmanager get-secret-value --secret-id ${AwsSecretName})
export MCLI_PUBLIC_API_KEY=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.PublicKey')
export MCLI_PRIVATE_API_KEY=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.PrivateKey')
export MCLI_ORG_ID=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.OrgId')
export MCLI_PROJECT_ID=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.ProjectId')

atlas dbusers delete $DatabaseUser --force --authDB '$external'

sam delete --stack-name ${URI} --no-prompts --region $AWS_DEFAULT_REGION --profile $AWS_PROFILE

yes | rm ../"${URI}"-keys.pem 2>/dev/null
