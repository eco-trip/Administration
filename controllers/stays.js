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
		return next(SendData(item.serialize('response'), 201));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.update = async (req, res, next) => {
	try {
		const stay = await Stay.query('sk')
			.eq('STAY#' + req.params.id)
			.limit(1)
			.exec();

		if (!stay.count) return next(NotFound());

		const { endTime, startTime } = req.body;
		const item = await Stay.update(
			{ pk: stay[0].pk, sk: 'STAY#' + req.params.id },
			{ startTime: startTime && new Date(startTime), endTime: endTime && new Date(endTime) }
		);
		return next(SendData(item.serialize('response')));
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
