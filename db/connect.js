const dynamoose = require('dynamoose');

const ddb = new dynamoose.aws.ddb.DynamoDB({
	region: process.env.AWS_DEFAULT_REGION,
	endpoint: process.env.DYNAMODB_ENDPOINT
});

dynamoose.aws.ddb.set(ddb);
