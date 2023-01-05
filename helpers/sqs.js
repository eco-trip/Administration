const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const { ENV, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, AWS_SQS_URL } = process.env;

let sqsClient;

if (ENV !== 'test') {
	if (ENV === 'dev') {
		sqsClient = new SQSClient({
			credentials: {
				accessKeyId: AWS_ACCESS_KEY_ID,
				secretAccessKey: AWS_SECRET_ACCESS_KEY
			},
			region: AWS_DEFAULT_REGION
		});
	} else {
		sqsClient = new SQSClient({
			region: AWS_DEFAULT_REGION
		});
	}
}

module.exports.sendMessage = async (hotelId, roomId, stayId) => {
	try {
		const command = new SendMessageCommand({
			MessageAttributes: {
				hotelId: {
					DataType: 'String',
					StringValue: hotelId
				},
				roomId: {
					DataType: 'String',
					StringValue: roomId
				},
				stayId: {
					DataType: 'String',
					StringValue: stayId
				}
			},
			MessageBody: 'Stay ' + stayId,
			MessageDeduplicationId: stayId,
			MessageGroupId: 'Stays',
			QueueUrl: AWS_SQS_URL
		});

		const res = await sqsClient.send(command);
		return Promise.resolve(res);
	} catch (e) {
		return Promise.reject(e);
	}
};
