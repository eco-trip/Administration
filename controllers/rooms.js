const { v1: uuidv1 } = require('uuid');

const { SendData, NotFound, ServerError } = require('../helpers/response');
const { Room } = require('../model/Room');

exports.get = async (req, res, next) => {
	try {
		const results = await Room.scan().exec();
		return next(SendData(results));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		const item = await Room.query('sk')
			.eq('ROOM#' + req.params.id)
			.exec();
		if (!item) return next(NotFound());
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.add = async (req, res, next) => {
	try {
		const id = uuidv1();
		const { hotelId, number, floor } = req.body;
		const item = await Room.create({ pk: 'HOTEL#' + hotelId, sk: 'ROOM#' + id, number, floor });
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		const exist = await Room.get(req.params.id);
		if (!exist) return next(NotFound());
		const item = await Room.update({ id: req.params.id, ...req.body });
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const item = await Room.get(req.params.id);
		if (!item) return next(NotFound());
		item.delete();
		return next(SendData());
	} catch (error) {
		return next(ServerError(error));
	}
};
