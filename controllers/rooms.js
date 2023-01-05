const { v1: uuidv1 } = require('uuid');

const { SendData, NotFound, ServerError, Forbidden } = require('../helpers/response');
const { Room } = require('../model/Room');
const { Stay } = require('../model/Stay');

exports.get = async (req, res, next) => {
	try {
		const rooms = await Room.scan().filter('sk').beginsWith('ROOM#').exec();
		return next(SendData(rooms.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		const room = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		return next(SendData(room[0].serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getStays = async (req, res, next) => {
	try {
		const room = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		const stays = await Stay.query('pk')
			.eq('ROOM#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('STAY#')
			.exec();

		return next(SendData(stays.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getCurrentStay = async (req, res, next) => {
	try {
		const room = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		const stay = await Stay.query('pk')
			.eq('ROOM#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('STAY#')
			.filter('endTime')
			.not()
			.exists()
			.exec();

		if (!stay.count) return next(SendData(false));

		return next(SendData(stay[0].serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.putStay = async (req, res, next) => {
	try {
		const room = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		const id = uuidv1();
		const { startTime } = req.body;
		const stay = await Stay.create({ pk: 'ROOM#' + req.params.id, sk: 'STAY#' + id, startTime: new Date(startTime) });
		return next(SendData(stay.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.add = async (req, res, next) => {
	try {
		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== req.body.hotelId)
			return next(Forbidden());

		const id = uuidv1();
		const { hotelId, number, floor } = req.body;
		const room = await Room.create({ pk: 'HOTEL#' + hotelId, sk: 'ROOM#' + id, number, floor });
		return next(SendData(room.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		const room = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		const edit = await Room.update({ pk: room[0].pk, sk: 'ROOM#' + req.params.id }, { ...req.body });
		return next(SendData(edit.serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const room = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		await room[0].delete();

		// delete stays for the room
		const stays = await Room.query('pk')
			.eq('ROOM#' + req.params.id)
			.exec();

		await Promise.all(stays.map(row => row.delete()));

		return next(SendData('Successfully deleted!'));
	} catch (error) {
		return next(ServerError(error));
	}
};
