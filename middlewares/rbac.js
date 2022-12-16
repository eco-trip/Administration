const { check } = require('../helpers/rbac');

module.exports = (resource, action) => (req, res, next) =>
	check(res.locals.user['custom:role'], resource, action)
		.then(grants => {
			res.locals.grants = grants;
			return next();
		})
		.catch(err => next(err));
