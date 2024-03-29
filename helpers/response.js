const Response = (message, statusCode = 500, data = {}, error = 1) => ({
	message,
	statusCode,
	data,
	error
});

module.exports = {
	/* OK */
	SendData: (data, statusCode = 200) => Response('Success', statusCode, data),

	/* ERRORS */
	CustomError: (message, statusCode, data, error) => Response(message, statusCode, data, error),

	ServerError: data =>
		Response('System error: operation not completed, please refresh the page or try again later', 500, data, 1),

	/* 200 - validation errors */

	ValidationError: (data, error = 200) => Response('Validation Error', 400, data, error),

	MissingRequiredParameter: data => Response('Missing required parameters', 400, data, 201),

	AdditionalParameters: data => Response('Additional parameters are not permitted', 400, data, 202),

	/* 300 - auth errors */

	WrongEmail: data => Response('Wrong email', 400, data, 300),

	WrongPassword: () => Response('Wrong password', 400, {}, 301),

	InactiveAccount: () => Response('Inactive account', 401, {}, 302),

	EmailAlreadyExists: data => Response('The email already exists', 400, data, 304),

	/* 400 - generic client error */

	BadRequest: () => Response('Bad request', 400, {}, 400),

	Unauthorized: () => Response('Unauthorized', 401, {}, 401),

	BlockedByCORS: () => Response('Not allowed by CORS', 401, {}, 402),

	Forbidden: () => Response('Forbidden', 403, {}, 403),

	NotFound: () => Response('Not found', 404, {}, 404),

	NotAcceptable: () => Response('Not acceptable', 406, {}, 406),

	InvalidRole: () => Response('Forbidden', 403, {}, 410),

	ForbiddenResources: () => Response('Forbidden', 403, {}, 411)
};
