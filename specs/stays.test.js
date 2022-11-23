const supertest = require('supertest');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');
const { createHotel, createRoom, createStay, isAuthUnautorized, isAuthOk, uuidValidate } = require('../test/utils');
const { isAuth } = require('../middlewares/isAuth');

const { Stay } = require('../model/Stay');

const app = require('../app');

jest.mock('../helpers/cognito');
jest.mock('../middlewares/isAuth');

let agent;
let room;
let stay;

const hotelId = uuidv1();
const roomId = uuidv1();
const stayId = uuidv1();

const now = new Date();

beforeEach(async () => {
	agent = supertest.agent(app);
	await clear();

	await createHotel(hotelId, { name: 'Hotel Name' });
	room = await createRoom(roomId, hotelId, { floor: 1, number: '101' });
	stay = await createStay(stayId, roomId, { startTime: now });
});
afterEach(() => jest.clearAllMocks());

describe('Role: admin', () => {
	describe('GET /stays', () => {
		test('Get all stays without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/stays')
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get all should contains just one stay with serialized fields', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/stays')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(1);

					const result = res.body[0];
					expect(result.id).toEqual(stay.sk.replace('STAY#', ''));
					expect(result.roomId).toEqual(room.sk.replace('ROOM#', ''));
					expect(result.startTime).toEqual(now.toISOString());
				});
		});
	});

	describe('GET /stays/:id', () => {
		test('Get stay without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/stays/' + stayId)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get stay with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/stays/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Get stay with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/stays/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Get stay with correct id should contain serialized fields', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/stays/' + stayId)
				.expect(200)
				.then(res => {
					const result = res.body;

					expect(result.id).toEqual(stay.sk.replace('STAY#', ''));
					expect(result.roomId).toEqual(room.sk.replace('ROOM#', ''));
					expect(result.startTime).toEqual(now.toISOString());
				});
		});
	});

	describe('POST /stays', () => {
		test('Add new stay without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newStay = { startTime: now.toISOString(), roomId };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Add new stay without startTime should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { roomId };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/startTime' }));
				});
		});

		test('Add new stay without roomId should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { startTime: now.toISOString() };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/roomId' }));
				});
		});

		test('Add new stay with startTime not Datetime should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { startTime: 123 };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200, data: '/startTime' }));
				});
		});

		test('Add new stay with incorrect roomId should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { startTime: now.toISOString(), roomId: '1234abcd' };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200, data: '/roomId' }));
				});
		});

		test('Add new stay with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { name: 2 };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/name' }));
				});
		});

		test('Add new stay with correct data should be Ok', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { startTime: now.toISOString(), roomId };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate.test(result.id)).toBe(true);
					expect(result.roomId).toEqual(roomId);
					expect(result.startTime).toEqual(newStay.startTime);

					// check db
					const items = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
					expect(items.length).toEqual(2);
					// const saved = items.find(e => e.number === newRoom.number);
					// expect(saved.pk).toEqual('HOTEL#' + hotelId);
					// expect(saved.sk).toContain('ROOM#');
				});
		});
	});

	describe('PATCH /stays/:id', () => {
		test('Update existing stay without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newStay = { startTime: now.toISOString(), roomId };

			return agent
				.patch('/stays/' + stayId)
				.send(newStay)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Update existing stay with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.patch('/stays/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Update existing stay with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.patch('/stays/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Update existing stay with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { name: 2 };

			return agent
				.patch('/stays/' + stayId)
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/name' }));
				});
		});

		test.todo('Update existing room with correct data should be Ok');
	});

	describe('DELETE /stays/:id', () => {
		test('Delete existing stay without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.delete('/stays/' + stayId)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Delete existing stay with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/stays/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Delete existing stay with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/stays/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Delete existing stay with correct id should be Ok', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/stays/' + stayId)
				.expect(200)
				.then(async res => {
					expect(res.body).toEqual('Successfully deleted!');

					// check db
					const items = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
					expect(items.length).toEqual(0);
				});
		});
	});
});
