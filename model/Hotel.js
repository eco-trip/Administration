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

const Hotel = dynamoose.model('Hotel', schema);

Hotel.serializer.add('response', {
	exclude: ['pk', 'sk'],
	modify: (serialized, original) => ({ ...serialized, id: original.sk.replace('METADATA#', '') })
});

module.exports.Hotel = Hotel;
