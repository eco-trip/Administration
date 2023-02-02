const jwt = require('jsonwebtoken');

const { SendData, NotFound, ServerError } = require('../helpers/response');
const { Stay } = require('../model/Stay');
const { Room } = require('../model/Room');
const { Hotel } = require('../model/Hotel');

exports.get = async (req, res, next) => {
	try {
		const stay = await Stay.query('sk')
			.eq('STAY#' + req.guestJwt.stayId)
			.limit(1)
			.exec();

		if (!stay.count) return next(NotFound());

		const room = await Room.query('sk').eq(stay[0].pk).limit(1).exec();

		if (!room.count) return next(NotFound());

		const hotel = await Hotel.query('pk').eq(room[0].pk).and().where('sk').beginsWith('METADATA#').limit(1).exec();

		if (!hotel.count) return next(NotFound());

		const response = {
			hotel: hotel[0].serialize('response'),
			room: room[0].serialize('response'),
			stay: stay[0].serialize('response')
		};

		return next(SendData(response));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.signJwt = stayId => jwt.sign({ stayId }, process.env.GUEST_JWT_SECRET);
