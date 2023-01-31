const { v1: uuidv1 } = require('uuid');
const { sendMessage } = require('../helpers/sqs');
const { SendData, NotFound, ServerError, Forbidden } = require('../helpers/response');
const { Stay } = require('../model/Stay');
const { Room } = require('../model/Room');

exports.get = async (req, res, next) => {
	try {
		const stays = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
		return next(SendData(stays.map(el => el.serialize('response'))));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.getById = async (req, res, next) => {
	try {
		const stay = await Stay.query('sk')
			.eq('STAY#' + req.params.id)
			.limit(1)
			.exec();

		if (!stay.count) return next(NotFound());

		const room = await Room.query('sk').eq(stay[0].pk).limit(1).exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		return next(SendData(stay[0].serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.add = async (req, res, next) => {
	try {
		const room = await Room.query('sk')
			.eq('ROOM#' + req.body.roomId)
			.limit(1)
			.exec();

		if (!room.count) return next(NotFound());

		const { hotelId } = room[0].serialize('response');

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== hotelId) return next(Forbidden());

		const id = uuidv1();
		const { roomId, startTime } = req.body;
		const item = await Stay.create({ pk: 'ROOM#' + roomId, sk: 'STAY#' + id, startTime: new Date(startTime) });
		await sendMessage('checkin', hotelId, req.body.roomId, id);
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

		const room = await Room.query('sk').eq(stay[0].pk).limit(1).exec();

		if (!room.count) return next(NotFound());

		const roomData = room[0].serialize('response');

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== roomData.hotelId)
			return next(Forbidden());

		const { endTime, startTime } = req.body;
		const edit = await Stay.update(
			{ pk: stay[0].pk, sk: 'STAY#' + req.params.id },
			{
				startTime: startTime ? new Date(startTime) : stay[0].startTime,
				endTime: endTime ? new Date(endTime) : stay[0].endTime
			}
		);

		if (endTime) await sendMessage('checkout', roomData.hotelId, roomData.id, req.params.id);
		return next(SendData(edit.serialize('response')));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.del = async (req, res, next) => {
	try {
		const stay = await Stay.query('sk')
			.eq('STAY#' + req.params.id)
			.limit(1)
			.exec();

		if (!stay.count) return next(NotFound());

		const room = await Room.query('sk').eq(stay[0].pk).limit(1).exec();

		if (!room.count) return next(NotFound());

		if (res.locals.grants.type !== 'any' && res.locals.user['custom:hotelId'] !== room[0].serialize('response').hotelId)
			return next(Forbidden());

		await stay[0].delete();
		return next(SendData('Successfully deleted!'));
	} catch (error) {
		return next(ServerError(error));
	}
};
