const { Unauthorized } = require('../helpers/response');
const { Hotel } = require('../model/Hotel');

exports.uuidValidate = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

exports.isAuthUnautorized = (req, res, next) => next(Unauthorized());

exports.isAuthOk = (req, res, next) => {
	res.locals.user = { username: 'test@ecotrip.com' };
	next();
};

exports.createHotel = async (id, data) => await Hotel.create({ pk: 'HOTEL#' + id, sk: 'METADATA#' + id, ...data });
