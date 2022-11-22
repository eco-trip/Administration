#!/bin/bash

source .env
source .env.test

if [ $(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME) != "true" ]; then
	docker kill $CONTAINER_NAME
	docker rm $CONTAINER_NAME
	if [[ "$(docker images -q $CONTAINER_NAME 2>/dev/null)" == "" ]]; then
		docker build -t $CONTAINER_NAME ./test
	fi
	docker run -dp 8100:8000 --name $CONTAINER_NAME $CONTAINER_NAME &
fi

ready="false"
until [ "$ready" = "true" ]; do
	if [ $(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME) = "true" ]; then
		ready="true"
	fi
	sleep 10
done

CMD="jest --verbose --forceExit --runInBand"

for param in "$@"; do
	CMD+=" ${param}"
done

eval $CMD
