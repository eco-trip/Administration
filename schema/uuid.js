module.exports = {
	uuid: {
		$id: 'uuid',
		type: 'object',
		definitions: {
			id: { type: 'string', format: 'uuid' }
		},
		properties: {
			id: { $ref: 'uuid#/definitions/id' }
		}
	}
};
