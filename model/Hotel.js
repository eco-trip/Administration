const dynamoose = require('dynamoose');

const schema = new dynamoose.Schema(
	{
		id: String,
		name: {
			type: String,
			index: true
		}
	},
	{
		timestamps: true
	}
);

module.exports.Hotel = dynamoose.model(`${process.env.Project}.${process.env.ENV}.Hotel`, schema);
