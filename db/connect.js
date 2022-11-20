const dynamoose = require('dynamoose');

const { Hotel } = require('../model/Hotel');
const { Room } = require('../model/Room');
const { Stay } = require('../model/Stay');

const ddb = new dynamoose.aws.ddb.DynamoDB({
	region: process.env.AWS_DEFAULT_REGION,
	endpoint: process.env.ENV === 'dev' ? process.env.DYNAMODB_ENDPOINT : undefined
});

dynamoose.aws.ddb.set(ddb);
dynamoose.Table.defaults.set({
	prefix: `${process.env.Project}.${process.env.ENV}.`
});

module.exports.Table = new dynamoose.Table(process.env.Target, [Hotel, Room, Stay]);
