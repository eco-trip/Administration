/* eslint-disable prefer-promise-reject-errors */
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const { signUp, signIn } = require('../helpers/cognito');
const { isAuth } = require('../middlewares/isAuth');
const { isAuthUnautorized, isAuthAdmin } = require('../test/utils');

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

	test('Invalid email', async () =>
		agent
			.post('/auth/login')
			.send({ email: 'wrong@email', password: 'wrongpwd' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 210, data: '/email' }));
			}));

	test('Missing password', async () =>
		agent
			.post('/auth/login')
			.send({ email: 'wrong@email.it' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/password' }));
			}));

	test('Wrong email', async () => {
		signIn.mockImplementation(() => Promise.reject(new Error('UserNotFoundException')));

		return agent
			.post('/auth/login')
			.send({ email: 'wrong@email.it', password: 'wrongpwd' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 300 }));
			});
	});

	test('Wrong password', async () => {
		signIn.mockImplementation(() => Promise.reject(new Error('NotAuthorizedException')));

		return agent
			.post('/auth/login')
			.send({ email: 'test@ecotrip.com', password: 'wrongpwd' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 301 }));
			});
	});

	test('Inactive account', async () => {
		signIn.mockImplementation(() => Promise.reject(new Error('UserNotConfirmedException')));

		return agent
			.post('/auth/login')
			.send({ email: 'test@ecotrip.com', password: 'testtest' })
			.expect(401)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 302 }));
			});
	});

	test('Login successfully', async () => {
		signIn.mockImplementation(() =>
			Promise.resolve({
				accessToken: 'accessToken123',
				accessTokenPayload: { username: 'admin@ecotrip.com' },
				accessTokenExp: moment()
					.add(60 * 60, 's')
					.unix(),
				refreshToken: 'refreshToken123',
				refreshTokenExp: process.env.RT_EXPIRES_TIME,
				idToken: 'idToken123',
				idTokenPayload: { username: 'admin@ecotrip.com' },
				idTokenExp: moment()
					.add(60 * 60, 's')
					.unix()
			})
		);

		return agent
			.post('/auth/login')
			.send({ email: 'admin@ecotrip.com', password: 'testtest' })
			.expect(200)
			.then(res => {
				expect(res.headers['set-cookie'][0]).toContain('accessToken=accessToken123;');
				expect(res.headers['set-cookie'][1]).toContain('refreshToken=refreshToken123;');
				expect(res.headers['set-cookie'][2]).toContain('idToken=idToken123;');
				expect(res.body).toEqual(expect.objectContaining({ username: 'admin@ecotrip.com' }));
			});
	});
});

describe('GET /auth/check', () => {
	test('Check with valid token should be OK', async () => {
		signIn.mockImplementation(() =>
			Promise.resolve({
				accessToken: 'accessToken123',
				accessTokenPayload: { username: 'admin@ecotrip.com' },
				accessTokenExp: moment()
					.add(60 * 60, 's')
					.unix(),
				refreshToken: 'refreshToken123',
				refreshTokenExp: process.env.RT_EXPIRES_TIME,
				idToken: 'idToken123',
				idTokenPayload: { username: 'admin@ecotrip.com' },
				idTokenExp: moment()
					.add(60 * 60, 's')
					.unix()
			})
		);

		isAuth.mockImplementation(isAuthAdmin);

		await agent
			.post('/auth/login')
			.send({ email: 'admin@ecotrip.com', password: 'testtest' })
			.expect(200)
			.then(res => {
				expect(res.headers['set-cookie'][0]).toContain('accessToken=accessToken123;');
				expect(res.headers['set-cookie'][1]).toContain('refreshToken=refreshToken123;');
				expect(res.headers['set-cookie'][2]).toContain('idToken=idToken123;');
				expect(res.body).toEqual(expect.objectContaining({ username: 'admin@ecotrip.com' }));
			});

		return agent
			.get('/auth/check')
			.expect(200)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ username: 'admin@ecotrip.com' }));
			});
	});

	test('Check without token should be Unauthorized', async () => {
		isAuth.mockImplementation(isAuthUnautorized);

		agent
			.get('/auth/check')
			.expect(401)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
			});
	});

	test('Check with invalid token should be Unauthorized', async () => {
		isAuth.mockImplementation(isAuthUnautorized);

		const token = jwt.sign(
			{
				id: 1,
				iat: Math.floor(Date.now() / 1000)
			},
			'JWT_SECRET',
			{
				expiresIn: parseInt(60 * 60 * 24)
			}
		);

		return agent
			.get('/auth/check')
			.set('Cookie', `AccessToken=${token}`)
			.expect(401)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
			});
	});
});

describe('POST /auth/register', () => {
	test('Register new user without email should be MissingRequiredParameter', async () =>
		agent
			.post('/auth/register')
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/email' }));
			}));

	test('Register new user with invalid email should be ValidationError', async () =>
		agent
			.post('/auth/register')
			.send({ email: 'wrong@email' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 210, data: '/email' }));
			}));

	test('Register new user without password should be MissingRequiredParameter', async () =>
		agent
			.post('/auth/register')
			.send({ email: 'test@ecotrip.com' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/password' }));
			}));

	test('Register new user with invalid password should be ValidationError', async () => {
		signUp.mockImplementation(() => Promise.reject(new Error('InvalidPasswordException')));

		return agent
			.post('/auth/register')
			.send({ email: 'test@ecotrip.com', password: 'invalidpassword', name: 'Pinco', family_name: 'Pallino' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 211, data: '/password' }));
			});
	});

	test('Register new user without name should be MissingRequiredParameter', async () =>
		agent
			.post('/auth/register')
			.send({ email: 'test@ecotrip.com', password: 'Testtest1!' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/name' }));
			}));

	test('Register new user without family_name should be MissingRequiredParameter', async () =>
		agent
			.post('/auth/register')
			.send({ email: 'test@ecotrip.com', password: 'Testtest1!', name: 'Pinco' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/family_name' }));
			}));

	test('Register new user with email that already exist should be EmailAlreadyExists', async () => {
		signUp.mockImplementation(() => Promise.reject(new Error('UsernameExistsException')));

		return agent
			.post('/auth/register')
			.send({ email: 'test@ecotrip.com', password: 'Testtest1!', name: 'Pinco', family_name: 'Pallino' })
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 304 }));
			});
	});

	test('Register new user with correct information should be OK', async () => {
		signUp.mockImplementation(() => Promise.resolve({ user: { username: 'test@ecotrip.com' } }));

		await agent
			.post('/auth/register')
			.send({ email: 'test@ecotrip.com', password: 'Testtest1!', name: 'Pinco', family_name: 'Pallino' })
			.expect(200)
			.then(res => {
				expect(res.body.user).toEqual(expect.objectContaining({ username: 'test@ecotrip.com' }));
			});
	});
});
