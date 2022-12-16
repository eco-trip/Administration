module.exports = {
	stay: {
		$id: 'stay',
		type: 'object',
		properties: {
			id: { $ref: 'uuid#/definitions/id' },
			roomId: { $ref: 'uuid#/definitions/id' },
			startTime: { type: 'string', format: 'date-time' },
			endTime: { type: 'string' }
		},
		additionalProperties: false
	},
	addStay: {
		type: 'object',
		allOf: [{ $ref: 'stay' }],
		required: ['roomId', 'startTime']
	},
	putStay: {
		type: 'object',
		allOf: [{ $ref: 'stay' }],
		required: ['startTime']
	}
};
