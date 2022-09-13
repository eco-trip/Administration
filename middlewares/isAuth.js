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
	const index = Object.keys(req.cookies).find(k => k.indexOf('accessToken') !== -1 || k.indexOf('AccessToken') !== -1);
	if (!index) return next(Unauthorized());

	const token = req.cookies[index];
	if (!token) return next(Unauthorized());

	try {
		const payload = await verifier.verify(token);
		res.locals.user = payload;
		return next();
	} catch (e) {
		return next(Unauthorized());
	}
};
