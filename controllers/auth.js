const moment = require('moment');
const { langs, defaultLang } = require('../config');

const { signUp, signIn } = require('../helpers/cognito');
const {
	SendData,
	ServerError,
	WrongEmail,
	WrongPassword,
	InactiveAccount,
	ValidationError,
	EmailAlreadyExists
} = require('../helpers/response');

exports.login = (req, res, next) =>
	signIn(req.body.email, req.body.password)
		.then(tokens => {
			res.cookie('AccessToken', tokens.accessToken, {
				httpOnly: true,
				expires: new Date(tokens.accessTokenExp * 1000),
				sameSite: 'strict',
				path: '/'
			});
			res.cookie('RefreshToken', tokens.refreshToken, {
				httpOnly: true,
				expires: new Date(moment().add(tokens.refreshTokenExp, 's').format()),
				sameSite: 'strict',
				path: '/'
			});
			next(SendData(tokens.accessTokenPayload));
		})
		.catch(e => {
			const code = e.code || e.message;
			switch (code) {
				case 'UserNotFoundException':
					next(WrongEmail(e));
					break;
				case 'NotAuthorizedException':
					next(WrongPassword(e));
					break;
				case 'UserNotConfirmedException':
					next(InactiveAccount(e));
					break;
				default:
					next(ServerError(e));
			}
		});

exports.check = (req, res, next) => next(SendData(res.locals.user));

exports.register = async (req, res, next) => {
	if (!req.body.lang || !langs.includes(req.body.lang)) {
		req.body.lang = defaultLang;
	}

	const attribute = {
		email: req.body.email,
		name: req.body.name,
		family_name: req.body.family_name,
		'custom:lang': req.body.lang,
		'custom:role': req.body.role ? req.body.role : 'user'
	};

	return signUp(req.body.email, req.body.password, attribute)
		.then(result => next(SendData(result)))
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
};
