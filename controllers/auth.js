const { signUp, signIn } = require('../helpers/cognito');
const { SendData, ServerError } = require('../helpers/response');

exports.login = (req, res, next) =>
	signIn(req.body.email, req.body.password)
		.then(result => next(SendData(result)))
		.catch(e => next(ServerError(e)));

exports.check = (req, res, next) => next(SendData({ user: res.locals.user, message: 'Token is valid!' }));

// exports.checkIfEmailExists = (req, res, next) => next(SendData({ id: res.locals.user.id, message: 'Token is valid!' }));

exports.register = async (req, res, next) => {
	const langs = ['it', 'en'];
	const defaultLang = 'en';

	if (req.body.lang && !langs.includes(req.body.lang)) {
		req.body.lang = defaultLang;
	}

	const attribute = { email: req.body.email, name: req.body.name, family_name: req.body.family_name };

	return signUp(req.body.email, req.body.password, attribute)
		.then(result => next(SendData(result)))
		.catch(e => next(ServerError(e)));
};
