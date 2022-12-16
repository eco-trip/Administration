const jwt = require('jsonwebtoken');

const { Unauthorized, MissingRequiredParameter } = require('../helpers/response');

// eslint-disable-next-line consistent-return
exports.isGuestJwt = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (token == null) return next(MissingRequiredParameter());

	jwt.verify(token, process.env.GUEST_JWT_SECRET, (err, decoded) => {
		if (err) return next(Unauthorized());

		req.guestJwt = decoded;
		return next();
	});
};
