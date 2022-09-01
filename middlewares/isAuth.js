const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { Unauthorized } = require('../helpers/response');

const verifier = CognitoJwtVerifier.create({
	userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
	tokenUse: 'access',
	clientId: process.env.AWS_COGNITO_CLIENT_ID
});

exports.isAuth = async (req, res, next) => {
	const token = Object.keys(req.cookies).length && req.cookies.AccessToken;
	if (!token) return next(Unauthorized());
	try {
		const payload = await verifier.verify(token);
		console.log('Token is valid. Payload:', payload);
		res.locals.user = payload;
		return next();
	} catch (e) {
		console.log('Token not valid!', e);
		return next(Unauthorized());
	}
};
