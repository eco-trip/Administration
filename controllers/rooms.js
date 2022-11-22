const { v1: uuidv1 } = require('uuid');

const { SendData, NotFound, ServerError } = require('../helpers/response');
const { Room } = require('../model/Room');

exports.get = async (req, res, next) => {
	try {
		const items = await Room.scan().filter('sk').beginsWith('ROOM#').exec();
		return next(SendData(items.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		const item = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!item.count) return next(NotFound());
		return next(SendData(item[0].serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.add = async (req, res, next) => {
	try {
		const id = uuidv1();
		const { hotelId, number, floor } = req.body;
		const item = await Room.create({ pk: 'HOTEL#' + hotelId, sk: 'ROOM#' + id, number, floor });
		return next(SendData(item.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		const item = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();

		if (!item.count) return next(NotFound());

		// await Room.update({ id: req.params.id, ...req.body }); TODO
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const item = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.limit(1)
			.exec();
		if (!item.count) return next(NotFound());

		await item[0].delete();

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
