const dynamoose = require('dynamoose');

const ddb = new dynamoose.aws.ddb.DynamoDB({
	region: process.env.AWS_DEFAULT_REGION,
	endpoint: process.env.ENV === 'dev' ? process.env.DYNAMODB_ENDPOINT : undefined
});

dynamoose.aws.ddb.set(ddb);
