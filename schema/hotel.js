module.exports = {
	hotel: {
		$id: 'hotel',
		type: 'object',
		properties: {
			id: { $ref: 'uuid#/definitions/id' },
			name: { type: 'string' },
			description: { type: 'string' },
			electricityCost: { type: 'number' },
			hotWaterCost: { type: 'number' },
			country: { type: 'string', minLength: 2, maxLength: 2 },
			city: { type: 'string' },
			address: { type: 'string' },
			zipcode: { type: 'string' }
		},
		additionalProperties: false
	},
	addHotel: {
		type: 'object',
		allOf: [{ $ref: 'hotel' }],
		required: ['name']
	}
};
