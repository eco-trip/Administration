#!/bin/bash

# LOAD PARAMETERS
source parameters

if [ $Env = "dev" ]; then
	echo "Nothinbg to do for \"dev\" environment..."
	exit 2
fi

# DELETE OLD STACK IF EXIST ON CTRL+C
trap "echo; echo \"DELETING THE STACK\"; bash destroy.sh -e ${Env} -p ${Project} -t ${Target} -g ${GitUsername}; exit" INT

# GET SECTRETS
AcmArn=$(echo ${Secrets} | jq .SecretString | jq -rc . | jq -rc '.AcmArn')
HostedZoneId=$(echo ${Secrets} | jq .SecretString | jq -rc . | jq -rc '.HostedZoneId')

# GET URL FROM S3 AND SET VARIABLES
aws s3 cp ${Urls} ./urls.json
Url=$(cat urls.json | jq ".${Target}.${Env}" | tr -d '"')

# DEPLOY API
cd ${RootFolder}
zip -r api.zip . -x "node_modules/*" -x "db/data/*"
aws s3 mb s3://${URI}
aws s3api put-object --bucket ${URI} --key api --body ./api.zip
rm ${RootFolder}/api.zip

# CREATE KEY PAIR FOR ACCESS TO EC2
aws ec2 create-key-pair --key-name "${URI}"-keys --query "KeyMaterial" --output text >"${RootFolder}"/"${URI}"-keys.pem || echo "This key-pair already exists, it won't be created. Remember to use destroy.sh when you want to destroy a stack."
chmod 400 "${RootFolder}"/"${URI}"-keys.pem
cd ${RootFolder}/deploy || exit

# SAM BUILD AND DEPLOY
Parameters="ParameterKey=URI,ParameterValue=${URI} ParameterKey=Url,ParameterValue=${Url} ParameterKey=AcmArn,ParameterValue=${AcmArn} ParameterKey=HostedZoneId,ParameterValue=${HostedZoneId} ParameterKey=Env,ParameterValue=${Env}"
sam build -t ./template.yml --parameter-overrides ${Parameters}
sam deploy \
	--template-file .aws-sam/build/template.yaml \
	--stack-name ${URI} \
	--disable-rollback \
	--resolve-s3 \
	--parameter-overrides ${Parameters} \
	--capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
	--tags project=${Project} env=${Env} creator=${GitUsername}

# API DEPLOYMENT WITH CODE DEPLOY
aws deploy create-deployment \
	--application-name ${URI}-codedeploy-application \
	--deployment-group-name ${URI}-deployment-group \
	--revision "revisionType=S3,s3Location={bucket=${URI},key=api,bundleType=zip}" \
	--target-instances "tagFilters=[{Key=DeploymentTag,Value=${URI},Type=KEY_AND_VALUE}]"
