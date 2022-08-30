const { v1: uuidv1 } = require('uuid');

const { SendData, NotFound, ServerError } = require('../helpers/response');
const { Hotel } = require('../model/Hotel');

exports.get = async (req, res, next) => {
	try {
		const results = await Hotel.scan().exec();
		return next(SendData(results));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		const item = await Hotel.get(req.params.id);
		if (!item) return next(NotFound());
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.add = async (req, res, next) => {
	try {
		const item = await Hotel.create({ id: uuidv1(), ...req.body });
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		const exist = await Hotel.get(req.params.id);
		if (!exist) return next(NotFound());
		const item = await Hotel.update({ id: req.params.id, ...req.body });
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const item = await Hotel.get(req.params.id);
		if (!item) return next(NotFound());
		item.delete();
		return next(SendData());
	} catch (error) {
		return next(ServerError(error));
	}
};
