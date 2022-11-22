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
		startTime: {
			type: {
				value: Date,
				required: true,
				settings: {
					storage: 'iso'
				}
			}
		},
		endTime: {
			type: {
				value: Date,
				settings: {
					storage: 'iso'
				}
			}
		}
	},
	{
		timestamps: true
	}
);

const Stay = dynamoose.model('Stay', schema);

Stay.serializer.add('response', {
	exclude: ['pk', 'sk'],
	modify: (serialized, original) => ({
		...serialized,
		roomId: original.pk.replace('ROOM#', ''),
		id: original.sk.replace('STAY#', '')
	})
});

module.exports.Stay = Stay;
