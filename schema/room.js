module.exports = {
	room: {
		$id: 'room',
		type: 'object',
		properties: {
			id: { type: 'string' },
			hotelId: { type: 'string' },
			number: { type: 'string' },
			floor: { type: 'number' }
		},
		additionalProperties: false
	},
	addRoom: {
		type: 'object',
		allOf: [{ $ref: 'room' }],
		required: ['number', 'floor', 'hotelId']
	}
};
