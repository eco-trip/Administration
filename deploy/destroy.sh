#!/bin/bash

read -p "Destroy everything? [y/N]" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
	exit
fi

# LOAD PARAMETERS
source parameters

if [ $Env = "dev" ]; then
	echo "Nothinbg to do for \"dev\" environment..."
	exit 2
fi

if [ "$Env" = "production" ]; then
	read -p "Are you sure? " -n 1 -r
	echo
	echo
	if [[ ! $REPLY =~ ^[Yy]$ ]]; then
		[[ "$0" = "$BASH_SOURCE" ]] && exit 1 || return 1 # handle exits from shell or function but don't exit interactive shell
	fi
fi

# GET URL FROM S3 AND SET VARIABLES
aws s3 cp ${Urls} ./urls.json
ApiUrl=$(cat urls.json | jq ".administration.${Env}" | tr -d '"')

# REMOVE S3 BUCKETS
aws s3 rm s3://"${URI}" --recursive 2>/dev/null || echo "S3 bucket not found, probably already deleted"
aws s3 rb s3://"${URI}" --force 2>/dev/null || echo "S3 bucket not found, probably already deleted"

# DELETE KEY PAIR
aws ec2 delete-key-pair --key-name "${URI}"-keys 2>/dev/null || echo "Key pair not found, probably already deleted"
yes | rm ../"${URI}"-keys.pem 2>/dev/null

# SAM DELETE
sam delete \
	--stack-name ${URI} \
	--no-prompts \
	--region ${AWS_DEFAULT_REGION} \
	--profile ${AWS_PROFILE}
