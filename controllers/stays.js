const { v1: uuidv1 } = require('uuid');

const { SendData, NotFound, ServerError } = require('../helpers/response');
const { Stay } = require('../model/Stay');

exports.get = async (req, res, next) => {
	try {
		const items = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
		return next(SendData(items.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		const item = await Stay.query('sk')
			.eq('STAY#' + req.params.id)
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
		const { roomId, startTime } = req.body;
		const item = await Stay.create({ pk: 'ROOM#' + roomId, sk: 'STAY#' + id, startTime: new Date(startTime) });
		return next(SendData(item.serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		const item = await Stay.query('sk')
			.eq('STAY#' + req.params.id)
			.limit(1)
			.exec();
		if (!item.count) return next(NotFound());

		// await Stay.update({ id: req.params.id, ...req.body }); TODO
		return next(SendData(item));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const item = await Stay.query('sk')
			.eq('STAY#' + req.params.id)
			.limit(1)
			.exec();
		if (!item.count) return next(NotFound());

		await item[0].delete();
		return next(SendData('Successfully deleted!'));
	} catch (error) {
		return next(ServerError(error));
	}
};
