module.exports = {
	hotel: {
		$id: 'hotel',
		type: 'object',
		properties: {
			id: { type: 'string' },
			name: { type: 'string' }
		},
		additionalProperties: false
	},
	addHotel: {
		type: 'object',
		allOf: [{ $ref: 'hotel' }],
		required: ['name']
	}
};
