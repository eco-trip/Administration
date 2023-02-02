module.exports = {
	user: {
		$id: 'user',
		type: 'object',
		properties: {
			email: { type: 'string' },
			name: { type: 'string' },
			family_name: { type: 'string' },
			password: { type: 'string' },
			lang: { type: 'string', minLength: 2, maxLength: 2 }
		},
		additionalProperties: false
	},
	putUser: {
		type: 'object',
		allOf: [{ $ref: 'user' }],
		required: ['email', 'name', 'family_name', 'password']
	}
};
