module.exports = {
	auth: {
		$id: 'auth',
		type: 'object',
		properties: {
			email: { type: 'string', format: 'email' },
			password: { type: 'string' },
			name: { type: 'string' },
			family_name: { type: 'string' },
			phone_number: { type: 'string' },
			lang: { type: 'string' },
			role: { type: 'string' }
		},
		additionalProperties: false,
		errorMessage: {
			properties: {
				email: '210'
			}
		}
	},
	loginAuth: {
		type: 'object',
		allOf: [{ $ref: 'auth' }],
		required: ['email', 'password']
	},
	registerAuth: {
		type: 'object',
		allOf: [{ $ref: 'auth' }],
		required: ['email', 'password', 'name', 'family_name']
	}
};
