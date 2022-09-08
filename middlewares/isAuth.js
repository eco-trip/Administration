const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { Unauthorized } = require('../helpers/response');

let verifier;

if (process.env.ENV !== 'test') {
	verifier = CognitoJwtVerifier.create({
		userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
		tokenUse: 'access',
		clientId: process.env.AWS_COGNITO_CLIENT_ID
	});
}

exports.isAuth = async (req, res, next) => {
	const token = Object.keys(req.cookies).length && req.cookies.AccessToken;
	if (!token) return next(Unauthorized());
	try {
		const payload = await verifier.verify(token);
		res.locals.user = payload;
		return next();
	} catch (e) {
		return next(Unauthorized());
	}
};
