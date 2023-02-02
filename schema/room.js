module.exports = {
	room: {
		$id: 'room',
		type: 'object',
		properties: {
			id: { $ref: 'uuid#/definitions/id' },
			hotelId: { $ref: 'uuid#/definitions/id' },
			number: { type: 'string' },
			floor: { type: 'number' }
		},
		additionalProperties: false
	},
	addRoom: {
		type: 'object',
		allOf: [{ $ref: 'room' }],
		required: ['hotelId', 'number', 'floor']
	},
	putRoom: {
		type: 'object',
		allOf: [{ $ref: 'room' }],
		required: ['number', 'floor']
	}
};
