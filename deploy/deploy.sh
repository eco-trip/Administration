#!/bin/bash

# LOAD PARAMETERS
source parameters

if [ $env = "dev" ]; then
	echo "Nothinbg to do for \"dev\" environment..."
	exit 2
fi

# DELETE OLD STACK IF EXIST
trap "echo; echo \"DELETING THE STACK\"; bash destroy.sh -e ${env} -p ${project} -t ${target} -g ${git_username}; exit" INT

# GET URL FROM S3 AND SET VARIABLES
aws s3 cp ${urls} ./urls.json
Url=$(cat urls.json | jq ".${target}.${env}" | tr -d '"')

# GET SECTRETS
secrets=$(aws secretsmanager get-secret-value --secret-id ${AWS_SECRETS} --cli-connect-timeout 1)
AcmArn=$(echo ${secrets} | jq .SecretString | jq -rc . | jq -rc '.AcmArn')
HostedZoneId=$(echo ${secrets} | jq .SecretString | jq -rc . | jq -rc '.HostedZoneId')

# DEPLOY API
cd ${root_folder}
zip -r api.zip . -x "node_modules/*" -x "db/data/*"
aws s3 mb s3://${URI}
aws s3api put-object --bucket ${URI} --key api --body ./api.zip
rm ${root_folder}/api.zip

# CREATE KEY PAIR FOR ACCESS TO EC2
aws ec2 create-key-pair --key-name "${URI}"-keys --query "KeyMaterial" --output text >"${root_folder}"/"${URI}"-keys.pem || echo "This key-pair already exists, it won't be created. Remember to use destroy.sh when you want to destroy a stack."
chmod 400 "${root_folder}"/"${URI}"-keys.pem
cd ${root_folder}/deploy || exit

# SAM BUILD AND DEPLOY
parameters="ParameterKey=URI,ParameterValue=${URI} ParameterKey=Url,ParameterValue=${Url} ParameterKey=AcmArn,ParameterValue=${AcmArn} ParameterKey=HostedZoneId,ParameterValue=${HostedZoneId} ParameterKey=Env,ParameterValue=${env}"
sam build -t ./template.yml --parameter-overrides ${parameters}
sam deploy --template-file .aws-sam/build/template.yaml --stack-name ${URI} --disable-rollback --resolve-s3 --parameter-overrides ${parameters} --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND --tags project=${project} env=${env} creator=${git_username}

# API DEPLOYMENT WITH CODE DEPLOY
aws deploy create-deployment --application-name ${URI}-codedeploy-application --deployment-group-name ${URI}-deployment-group --revision "revisionType=S3,s3Location={bucket=${URI},key=api,bundleType=zip}" --target-instances "tagFilters=[{Key=DeploymentTag,Value=${URI},Type=KEY_AND_VALUE}]"
