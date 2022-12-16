const { v1: uuidv1 } = require('uuid');

const { SendData, NotFound, ServerError, Forbidden } = require('../helpers/response');
const { Hotel } = require('../model/Hotel');
const { Room } = require('../model/Room');

exports.get = async (req, res, next) => {
	try {
		const hotels = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
		return next(SendData(hotels.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== req.params.id)
			return next(Forbidden());

		const hotel = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('METADATA#')
			.limit(1)
			.exec();

		if (!hotel.count) return next(NotFound());
		return next(SendData(hotel[0].serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getRooms = async (req, res, next) => {
	try {
		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== req.params.id)
			return next(Forbidden());

		const rooms = await Room.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('ROOM#')
			.exec();

		if (!rooms.count) return next(NotFound());
		return next(SendData(rooms.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.putRoom = async (req, res, next) => {
	try {
		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== req.params.id)
			return next(Forbidden());

		const hotel = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('METADATA#')
			.limit(1)
			.exec();

		if (!hotel.count) return next(NotFound());

		const id = uuidv1();
		const { number, floor } = req.body;
		const room = await Room.create({ pk: 'HOTEL#' + req.params.id, sk: 'ROOM#' + id, number, floor });
		return next(SendData(room.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.add = async (req, res, next) => {
	try {
		const id = uuidv1();
		const hotel = await Hotel.create({ pk: 'HOTEL#' + id, sk: 'METADATA#' + id, ...req.body });
		return next(SendData(hotel.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== req.params.id)
			return next(Forbidden());

		const hotel = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('METADATA#')
			.limit(1)
			.exec();

		if (!hotel.count) return next(NotFound());

		const edit = await Hotel.update({ pk: 'HOTEL#' + req.params.id, sk: 'METADATA#' + req.params.id }, { ...req.body });
		return next(SendData(edit.serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const hotels = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.exec();

		if (!hotels.count) return next(NotFound());

		await Promise.all(hotels.map(row => row.delete()));

		return next(SendData('Successfully deleted!'));
	} catch (error) {
		return next(ServerError(error));
	}
};
