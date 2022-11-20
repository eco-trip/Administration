const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { signUp, signIn } = require('../helpers/cognito');
const { isAuth } = require('../middlewares/isAuth');
const { Unauthorized } = require('../helpers/response');

const app = require('../app');

jest.mock('../helpers/cognito');
jest.mock('../middlewares/isAuth');

let agent;

beforeEach(async () => {
	agent = supertest.agent(app);
});
afterEach(() => jest.clearAllMocks());

describe('POST /auth/login', () => {
	test('Missing credentials', async () =>
		agent
			.post('/auth/login')
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201 }));
			}));
});
