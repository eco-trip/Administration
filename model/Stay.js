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

module.exports.Stay = dynamoose.model('Stay', schema);
