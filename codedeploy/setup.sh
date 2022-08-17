#!/bin/bash
cd /home/ec2-user/app || exit
npm i >outputInstall.log

# !!!
DestinationCidrBlock=192.168.248.0/21

export AWS_DEFAULT_REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | jq .region | tr -d "\"")
macid=$(curl http://169.254.169.254/latest/meta-data/network/interfaces/macs/)
VpcId=$(curl http://169.254.169.254/latest/meta-data/network/interfaces/macs/${macid}/vpc-id)
VpcPeeringConnectionId=$(aws ec2 describe-vpc-peering-connections --filters Name=accepter-vpc-info.vpc-id,Values=$VpcId --query "VpcPeeringConnections[0].VpcPeeringConnectionId" --output text)
aws ec2 accept-vpc-peering-connection --vpc-peering-connection-id $VpcPeeringConnectionId

PublicRouteTableId=$(cat /home/ec2-user/PublicRouteTableId)
aws ec2 create-route --route-table-id $PublicRouteTableId --destination-cidr-block $DestinationCidrBlock --vpc-peering-connection-id $VpcPeeringConnectionId

ENV=$(cat /home/ec2-user/env)
DATABASE_URL=$(cat /home/ec2-user/DBUrl)
DATABASE_NAME=$(cat /home/ec2-user/DatabaseName)
START_SEEDER=$(cat /home/ec2-user/startSeeder)
SECRET_NAME=$(cat /home/ec2-user/SecretName)

source .env
source .env.${ENV}

database_uri="${DATABASE_URL}/${DATABASE_NAME}?authSource=%24external&authMechanism=MONGODB-AWS"

aws s3 cp $urls ./urls.json
CPUrl=$(cat urls.json | jq ".cp.${ENV}" | tr -d '"')
PillsUrl=$(cat urls.json | jq ".pills.${ENV}" | tr -d '"')
WebSiteUrl=$(cat urls.json | jq ".website.${ENV}" | tr -d '"')
S3DataBucket=$(cat urls.json | jq ".data.${ENV}" | tr -d '"')
S3DataBucket=$(echo ${S3DataBucket/__username__/$gitUsername})
S3DataTmpBucket=$(cat urls.json | jq ".data-tmp.${ENV}" | tr -d '"')
S3DataTmpBucket=$(echo ${S3DataTmpBucket/__username__/$gitUsername})

secret=$(aws secretsmanager get-secret-value --secret-id ${SECRET_NAME})
JWT_SECRET=$(echo $secret | jq .SecretString | jq -rc . | jq -rc '.JWT_SECRET')
RT_SECRET=$(echo $secret | jq .SecretString | jq -rc . | jq -rc '.RT_SECRET')
CHANGE_PASSWORD_SECRET=$(echo $secret | jq .SecretString | jq -rc . | jq -rc '.CHANGE_PASSWORD_SECRET')
MAILTRAP_USER=$(echo $secret | jq .SecretString | jq -rc . | jq -rc '.MAILTRAP_USER')
MAILTRAP_PASSWORD=$(echo $secret | jq .SecretString | jq -rc . | jq -rc '.MAILTRAP_PASSWORD')

echo "MONGO_DATABASE_HOST=${DATABASE_URL}" >>.env.${ENV}
echo "MONGO_DATABASE_NAME=${DATABASE_NAME}" >>.env.${ENV}
echo "AWS_S3_BUCKET_DATA=${S3DataBucket}" >>.env.${ENV}
echo "AWS_S3_BUCKET_TMP=${S3DataTmpBucket}" >>.env.${ENV}
echo "WEBSITE_URL=${WebSiteUrl}" >>.env.${ENV}
echo "WEBSITE_CORS_ORIGIN=https://${WebSiteUrl}" >>.env.${ENV}
echo "CP_URL=${CPUrl}" >>.env.${ENV}
echo "CP_CORS_ORIGIN=https://${CPUrl}" >>.env.${ENV}
echo "PILLS_URL=${PillsUrl}" >>.env.${ENV}
echo "PILLS_CORS_ORIGIN=https://${PillsUrl}" >>.env.${ENV}
echo "SECRET_NAME=${SECRET_NAME}" >> .env.${ENV}
echo "JWT_SECRET=${JWT_SECRET}" >> .env.${ENV}
echo "RT_SECRET=${RT_SECRET}" >> .env.${ENV}
echo "CHANGE_PASSWORD_SECRET=${CHANGE_PASSWORD_SECRET}" >> .env.${ENV}
echo "MAILTRAP_USER=${MAILTRAP_USER}" >> .env.${ENV}
echo "MAILTRAP_PASSWORD=${MAILTRAP_PASSWORD}" >> .env.${ENV}

i=1
until exit | mongosh $database_uri 2>&1; do
	echo Test connection [$i/10] failed
	let i++
	sleep 10

	if [ $i -eq 10 ]; then
		exit 1
	fi
done

echo
echo "Connection available"

if [ "${START_SEEDER}" = "true" ]; then
	echo "Seeding..." >>seeder.log
	cd db/seed
	dir=$(ls *.json)
	for file in $dir; do
		mongoimport --collection "${file%.*}" --drop --file $file --jsonArray --uri $database_uri 2>&1
	done
fi

npm run migrate:up
