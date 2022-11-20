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
		name: { type: String, required: true },
		description: String,
		cost: Number,
		country: String,
		city: String,
		address: String,
		zipcode: String
	},
	{
		timestamps: true
	}
);

module.exports.Hotel = dynamoose.model('Hotel', schema);
