FROM node:16-alpine

ENV AWS_ACCESS_KEY_ID local
ENV AWS_SECRET_ACCESS_KEY local
ENV AWS_DEFAULT_REGION eu-west-1

RUN apk add --no-cache bash py3-pip &&\
    pip3 install --upgrade pip &&\
    pip3 --no-cache-dir install --upgrade awscli

RUN aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID &&\
    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY &&\
    aws configure set default.region $AWS_DEFAULT_REGION &&\
		aws configure set default.output json

WORKDIR '/data'

CMD ["/bin/bash", "-c", "./node_modules/.bin/nodemon"]