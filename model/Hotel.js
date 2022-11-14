const dynamoose = require('dynamoose');

const schema = new dynamoose.Schema(
	{
		pk: {
			type: String,
			hashKey: true
		},
		sk: {
			type: String,
			rangeKey: true,
			index: { global: true }
		},
		name: String,
		description: String
	},
	{
		timestamps: true
	}
);

module.exports.Hotel = dynamoose.model('Hotel', schema);
