const supertest = require('supertest');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');
const { createHotel, isAuthUnautorized, isAuthOk, uuidValidate } = require('../test/utils');
const { isAuth } = require('../middlewares/isAuth');

const { Hotel } = require('../model/Hotel');

const app = require('../app');

jest.mock('../helpers/cognito');
jest.mock('../middlewares/isAuth');

let agent;
let hotel;

const hotelId = uuidv1();

beforeEach(async () => {
	agent = supertest.agent(app);
	await clear();

	hotel = await createHotel(hotelId, { name: 'Hotel Name' });
});
afterEach(() => jest.clearAllMocks());

describe('Role: admin', () => {
	describe('GET /hotels', () => {
		test('Get all hotels without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/hotels')
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get all should contains just one Hotel with serialized fields', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/hotels')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(1);

					const result = res.body[0];
					expect(result.id).toEqual(hotel.pk.replace('HOTEL#', ''));
					expect(result.name).toEqual(hotel.name);
				});
		});
	});

	describe('GET /hotels/:id', () => {
		test('Get hotel without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/hotels/' + hotelId)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get hotel with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/hotels/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Get hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/hotels/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Get hotel with correct id should contain serialized fields', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/hotels/' + hotelId)
				.expect(200)
				.then(res => {
					const result = res.body;
					expect(result.id).toEqual(hotel.pk.replace('HOTEL#', ''));
					expect(result.name).toEqual(hotel.name);
				});
		});
	});

	describe('POST /hotels', () => {
		test('Add new hotel without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newHotel = { name: 'New Hotel' };

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Add new hotel without name should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newHotel = {};

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/name' }));
				});
		});

		test('Add new hotel with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newHotel = { title: 'New Hotel' };

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/title' }));
				});
		});

		test('Add new hotel with correct data should be Ok', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newHotel = { name: 'New Hotel' };

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate.test(result.id)).toBe(true);
					expect(result.name).toEqual(newHotel.name);

					// check db
					const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
					expect(items.length).toEqual(2);
					const saved = items.find(e => e.name === newHotel.name);
					expect(saved.pk).toContain('HOTEL#');
					expect(saved.sk).toContain('METADATA#');
				});
		});
	});

	describe('PATCH /hotels/:id', () => {
		test('Update existing hotel without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newHotel = { name: 'New Hotel' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(newHotel)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Update existing hotel with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.patch('/hotels/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Update existing hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.patch('/hotels/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Update existing hotel with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newHotel = { title: 'New Hotel' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(newHotel)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/title' }));
				});
		});

		test.todo('Update existing hotel with correct data should be Ok');
	});

	describe('DELETE /hotels/:id', () => {
		test('Delete existing hotel without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.delete('/hotels/' + hotelId)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Delete existing hotel with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/hotels/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Delete existing hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/hotels/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Delete existing hotel by id with correct id should contain serialized fields', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/hotels/' + hotelId)
				.expect(200)
				.then(async res => {
					expect(res.body).toEqual('Successfully deleted!');

					// check db
					const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
					expect(items.length).toEqual(0);
				});
		});
	});
});
