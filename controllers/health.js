const { SendData, BadRequest } = require('../helpers/response');

exports.check = (req, res, next) => (req.params.id > 10 ? next(BadRequest()) : next(SendData(req.params.id)));
