const { v1: uuidv1 } = require('uuid');
const { signUp, search } = require('../helpers/cognito');
const {
	SendData,
	NotFound,
	ServerError,
	Forbidden,
	ValidationError,
	EmailAlreadyExists
} = require('../helpers/response');
const { langs, defaultLang } = require('../config');

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

		const hotel = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('METADATA#')
			.limit(1)
			.exec();

		if (!hotel.count) return next(NotFound());

		const rooms = await Room.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('ROOM#')
			.exec();

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

exports.getUser = async (req, res, next) => {
	try {
		const hotel = await Hotel.query('pk')
			.eq('HOTEL#' + req.params.id)
			.and()
			.where('sk')
			.beginsWith('METADATA#')
			.limit(1)
			.exec();

		if (!hotel.count) return next(NotFound());

		return search(hotel[0].userId)
			.then(result => next(SendData(result)))
			.catch(e => next(ServerError(e)));
	} catch (error) {
		return next(ServerError(error));
	}
};

exports.putUser = async (req, res, next) => {
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

		if (!req.body.lang || !langs.includes(req.body.lang)) {
			req.body.lang = defaultLang;
		}

		const attribute = {
			email: req.body.email,
			name: req.body.name,
			family_name: req.body.family_name,
			'custom:lang': req.body.lang,
			'custom:role': 'hotelier',
			'custom:hotelId': req.params.id
		};

		return signUp(req.body.email, req.body.password, attribute)
			.then(async result => {
				await Hotel.update(
					{ pk: 'HOTEL#' + req.params.id, sk: 'METADATA#' + req.params.id },
					{ userId: result.userSub }
				);

				next(SendData(result));
			})
			.catch(e => {
				const code = e.code || e.message;
				switch (code) {
					case 'InvalidPasswordException':
						next(ValidationError('/password', 211));
						break;
					case 'UsernameExistsException':
						next(EmailAlreadyExists(e));
						break;
					default:
						next(ServerError(e));
				}
				next(ServerError(e));
			});
	} catch (error) {
		return next(ServerError(error));
	}
};
