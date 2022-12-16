const { v1: uuidv1 } = require('uuid');

const { SendData, NotFound, ServerError } = require('../helpers/response');
const { Hotel } = require('../model/Hotel');
const { Room } = require('../model/Room');

exports.get = async (req, res, next) => {
	try {
		const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
		return next(SendData(items.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		const item = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('METADATA#')
			.limit(1)
			.exec();

		if (!item.count) return next(NotFound());
		return next(SendData(item[0].serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getRooms = async (req, res, next) => {
	try {
		const items = await Room.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('ROOM#')
			.exec();

		if (!items.count) return next(NotFound());
		return next(SendData(items.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.putRoom = async (req, res, next) => {
	try {
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
		const item = await Room.create({ pk: 'HOTEL#' + req.params.id, sk: 'ROOM#' + id, number, floor });
		return next(SendData(item.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.add = async (req, res, next) => {
	try {
		const id = uuidv1();
		const item = await Hotel.create({ pk: 'HOTEL#' + id, sk: 'METADATA#' + id, ...req.body });
		return next(SendData(item.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		const hotel = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('METADATA#')
			.limit(1)
			.exec();

		if (!hotel.count) return next(NotFound());

		const item = await Hotel.update({ pk: 'HOTEL#' + req.params.id, sk: 'METADATA#' + req.params.id }, { ...req.body });
		return next(SendData(item.serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const items = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.exec();

		if (!items.count) return next(NotFound());

		await Promise.all(items.map(row => row.delete()));

		return next(SendData('Successfully deleted!'));
	} catch (error) {
		return next(ServerError(error));
	}
};
