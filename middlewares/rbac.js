const { check } = require('../helpers/rbac');

module.exports = (resource, action) => (req, res, next) => {
	if (res.locals.user.superadmin) {
		res.locals.grants = { type: 'any' };
		return next();
	}
	return check(res.locals.user.role, resource, action)
		.then(grants => {
			res.locals.grants = grants;
			return next();
		})
		.catch(err => next(err));
};
