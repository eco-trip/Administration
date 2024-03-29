const { Unauthorized } = require('../helpers/response');
const { Hotel } = require('../model/Hotel');
const { Room } = require('../model/Room');
const { Stay } = require('../model/Stay');

exports.uuidValidate = () => /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

exports.isAuthUnautorized = (req, res, next) => next(Unauthorized());

exports.isAuthAdmin = (req, res, next) => {
	res.locals.user = {
		'custom:lang': 'it',
		token_use: 'id',
		name: 'Admin',
		'custom:role': 'admin',
		email: 'admin@ecotrip.com',
		username: 'admin@ecotrip.com'
	};
	next();
};

exports.isAuthHotelier = hotelId => (req, res, next) => {
	res.locals.user = {
		'custom:lang': 'it',
		token_use: 'id',
		name: 'Hotelier',
		'custom:role': 'hotelier',
		'custom:hotelId': hotelId,
		email: 'hotelier@ecotrip.com',
		username: 'hotelier@ecotrip.com'
	};
	next();
};

exports.createHotel = async (id, data) => await Hotel.create({ pk: 'HOTEL#' + id, sk: 'METADATA#' + id, ...data });

exports.createRoom = async (id, hotelId, data) =>
	await Room.create({ pk: 'HOTEL#' + hotelId, sk: 'ROOM#' + id, ...data });

exports.createStay = async (id, roomId, data) => await Stay.create({ pk: 'ROOM#' + roomId, sk: 'STAY#' + id, ...data });
