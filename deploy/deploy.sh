#!/bin/bash

source ../.env

rootFolder=$(dirname $(pwd))
gitUsername=$(echo $(git config user.name) | tr '[:upper:]' '[:lower:]')
startSeeder="false"

while getopts ":hSe:p:l:t:a:g:d:s:" opt; do
  case $opt in
  h)
    echo "This script generates the cloud structure needed.
    Flags:
      -e  Specify the env [dev, production, staging]
      -p  Specify the project name
      -a  Specify the aws profile to use
      -g  Specify the creator of the resource [default git username]
      -d  Specify the domain name
      -s  Specify the subdomain
      -S  Start seeder"
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
  d)
    domain="$OPTARG"
    ;;
  s)
    subdomain="$OPTARG"
    ;;
  S)
    startSeeder="true"
    ;;
  \?)
    echo "Invalid option: -$OPTARG"
    ;;
  esac
done

if [ "$env" = "" ]; then
  echo "No env specified, use -e to select the environment"
  exit 3
fi

if [ "$projectName" = "" ]; then
  echo "Specify the project name with the -p flag"
  exit 3
fi

trap "echo; echo \"DELETING THE STACK\"; bash destroy.sh -e ${env} -p ${projectName} -a ${AWS_PROFILE} -g ${gitUsername} -d ${domain} -s ${subdomain}; exit" INT

if [ $env = "dev" ]; then
  URI="${projectName}"-"${env}"-"${gitUsername}"-"${subdomain}"-api
else
  URI="${projectName}"-"${env}"-"${subdomain}"-api
fi

# SET AWS REGION, PROFILE AND THE WAY THE RESPONSES ARE SHOWN FOR ALL COMMANDS
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
export AWS_PAGER=""

aws s3 cp $urls ./urls.json
ApiUrl=$(cat urls.json | jq ".api.${env}" | tr -d '"')

ClusterName=$(echo $URI | tr -d "-")
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# SETUP CODE AND EC2 KEYS FOR API
if [ "$env" != "dev" ]; then
  # DEPLOY API
  echo $rootFolder
  cd $rootFolder
  zip -r api.zip . -x "node_modules/*" -x "db/data/*"
  aws s3 mb s3://${URI}
  aws s3api put-object --bucket ${URI} --key api --body ./api.zip
  rm ${rootFolder}/api.zip
  aws ec2 create-key-pair --key-name "${URI}"-keys --query "KeyMaterial" --output text >"${rootFolder}"/"${URI}"-keys.pem || echo "This key-pair already exists, it won't be created. Remember to use destroy.sh when you want to destroy a stack."
  chmod 400 "${rootFolder}"/"${URI}"-keys.pem
  cd ${rootFolder}/deploy || exit

  Parameters="ParameterKey=env,ParameterValue=$env ParameterKey=URI,ParameterValue=$URI ParameterKey=domain,ParameterValue=$domain ParameterKey=AcmArn,ParameterValue=$AcmArn ParameterKey=startSeeder,ParameterValue=$startSeeder ParameterKey=ApiUrl,ParameterValue=$ApiUrl ParameterKey=DatabaseName,ParameterValue=$DatabaseName ParameterKey=AwsSecretName,ParameterValue=$AwsSecretName ParameterKey=ClusterName,ParameterValue=$ClusterName ParameterKey=ClusterRegion,ParameterValue=$AWS_DEFAULT_REGION ParameterKey=HostedZoneId,ParameterValue=$HostedZoneId ParameterKey=DatabaseSrv,ParameterValue=$DatabaseSrv"
  sam build -t ./template.yml --parameter-overrides $Parameters
  sam deploy --template-file .aws-sam/build/template.yaml --stack-name ${URI} --disable-rollback --resolve-s3 --parameter-overrides $Parameters --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND --tags projectName=$projectName env=$env creator=$gitUsername subdomain=$subdomain

  # API DEPLOYMENT
  aws deploy create-deployment --application-name $URI-codedeploy-application --deployment-group-name $URI-deployment-group --revision "revisionType=S3,s3Location={bucket=$URI,key=api,bundleType=zip}" --target-instances "tagFilters=[{Key=DeploymentTag,Value=$URI,Type=KEY_AND_VALUE}]"

  # DB Backup Enabled
  # We use the default policy, to change policy programmatically: https://www.mongodb.com/docs/atlas/reference/api/cloud-backup/schedule/modify-one-schedule/
  export MCLI_PUBLIC_API_KEY=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.PublicKey')
  export MCLI_PRIVATE_API_KEY=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.PrivateKey')
  export MCLI_ORG_ID=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.OrgId')
  export MCLI_PROJECT_ID=$(echo $secret | jq .SecretString | jq -rc | jq -rc '.ProjectId')

  # curl --user "${MCLI_PUBLIC_API_KEY}:${MCLI_PRIVATE_API_KEY}" --digest \
  #   --header "Content-Type: application/json" \
  #   --include \
  #   --request PATCH "https://cloud.mongodb.com/api/atlas/v1.0/groups/${MCLI_PROJECT_ID}/clusters/${ClusterName}" \
  #   --data '
  #      {
	# 			 "providerBackupEnabled": true,
	# 			 "pitEnabled": true,
	# 			 "diskBackupEnabled": true
  #      }'
fi

# SEED S3
if [ "$startSeeder" = "true" ]; then
  yes y | bash ./seederS3.sh -e ${env} -p ${projectName} -a ${AWS_PROFILE} -g ${gitUsername} -d ${domain} -s ${subdomain}
fi
