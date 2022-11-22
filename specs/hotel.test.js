const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');

const { signUp, signIn } = require('../helpers/cognito');
const { isAuth } = require('../middlewares/isAuth');
const { Unauthorized } = require('../helpers/response');

const { Hotel } = require('../model/Hotel');

const app = require('../app');

jest.mock('../helpers/cognito');
jest.mock('../middlewares/isAuth');

let agent;

beforeEach(async () => {
	agent = supertest.agent(app);
	await clear();
});
afterEach(() => jest.clearAllMocks());

describe('GET /hotels', () => {
	test('Test 1', async () => {
		const id = uuidv1();
		await Hotel.create({ pk: 'HOTEL#' + id, sk: 'METADATA#' + id, name: 'test 1' });

		const result = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();

		console.log('result', result);

		return agent
			.post('/auth/login')
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201 }));
			});
	});

	test('Test 2', async () => {
		const id = uuidv1();
		await Hotel.create({ pk: 'HOTEL#' + id, sk: 'METADATA#' + id, name: 'test 2' });

		const result = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();

		console.log('result', result);

		return agent
			.post('/auth/login')
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201 }));
			});
	});
});
