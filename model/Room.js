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

const Room = dynamoose.model('Room', schema);

Room.serializer.add('response', {
	exclude: ['pk', 'sk'],
	modify: (serialized, original) => ({
		...serialized,
		hotelId: original.pk.replace('HOTEL#', ''),
		id: original.sk.replace('ROOM#', '')
	})
});

module.exports.Room = Room;
