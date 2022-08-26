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

module.exports.Hotel = dynamoose.model('Hotel', schema);
