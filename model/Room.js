const dynamoose = require('dynamoose');

const schema = new dynamoose.Schema(
	{
		pk: {
			type: String,
			hashKey: true,
			required: true
		},
		sk: {
			type: String,
			rangeKey: true,
			index: { global: true, name: 'skIndex' },
			required: true
		},
		number: { type: String, required: true },
		floor: { type: Number, required: true }
	},
	{
		timestamps: true
	}
);

module.exports.Room = dynamoose.model('Room', schema);
