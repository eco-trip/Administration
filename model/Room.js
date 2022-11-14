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
		number: String,
		floor: Number
	},
	{
		timestamps: true
	}
);

module.exports.Room = dynamoose.model('Room', schema);
