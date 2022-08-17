/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const { ServerError, ValidationError, MissingRequiredParameter, AdditionalParameters } = require('../helpers/response');

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);
require('ajv-errors')(ajv);

ajv.addFormat(
	'iso-date-string',
	dateTimeString => !Number.isNaN(Date.parse(new Date(dateTimeString.replace(' ', '+'))))
);

const validatorPath = `${__dirname}/../schema/`;
fs.readdirSync(validatorPath)
	.filter(file => file.split('.')[1] === 'js')
	.forEach(file => {
		const f = path.parse(file).name;
		const schema = require(`${validatorPath}${f}.js`);
		Object.keys(schema).forEach(key => ajv.addSchema(schema[key], key));
	});

const errorParser = data => {
	const [error] = data;
	const { keyword, instancePath, message, params } = error;

	switch (keyword) {
		case 'required':
			return MissingRequiredParameter('/' + params.missingProperty);
		case 'additionalProperties':
			return AdditionalParameters('/' + params.additionalProperty);
		case 'errorMessage':
			return ValidationError(instancePath, Number(message));
		default: {
			return ValidationError(instancePath);
		}
	}
};

exports.validator = schemas => (req, res, next) => {
	const schemasObj = typeof schemas === 'string' ? { body: schemas } : schemas;

	Object.keys(schemasObj).forEach(key => {
		const validate = ajv.getSchema(schemasObj[key]);

		if (!validate) return next(ServerError('Missing validator schema'));

		const valid = validate(req[key]);
		if (!valid) return next(errorParser(validate.errors));

		return true;
	});

	next();
};
