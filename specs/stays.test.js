const supertest = require('supertest');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');
const { createHotel, createRoom, createStay, isAuthUnautorized, isAuthAdmin, uuidValidate } = require('../test/utils');
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
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.get('/stays/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Get stay with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.get('/stays/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Get stay with correct id should contain serialized fields', async () => {
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

			const newStay = { name: 2 };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/name' }));
				});
		});

		test('Add new stay with correct data should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newStay = { startTime: now.toISOString(), roomId };

			return agent
				.post('/stays/')
				.send(newStay)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.roomId).toEqual(roomId);
					expect(result.startTime).toEqual(newStay.startTime);

					// check db
					const items = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
					expect(items.length).toEqual(2);
					const saved = items.find(e => e.sk === 'STAY#' + result.id);
					expect(saved.pk).toEqual('ROOM#' + roomId);
					expect(saved.startTime.toISOString()).toEqual(newStay.startTime);
					expect(saved.endTime).toBeUndefined();
				});
		});
	});

	describe('PATCH /stays/:id', () => {
		test('Update existing stay without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const editStay = { startTime: now.toISOString() };

			return agent
				.patch('/stays/' + stayId)
				.send(editStay)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Update existing stay with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.patch('/stays/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Update existing stay with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.patch('/stays/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Update existing stay with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const editStay = { name: 2 };

			return agent
				.patch('/stays/' + stayId)
				.send(editStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/name' }));
				});
		});

		test('Update existing room with only startTime data should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const editStay = { startTime: now.toISOString() };

			return agent
				.patch('/stays/' + stayId)
				.send(editStay)
				.expect(200)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.roomId).toEqual(roomId);
					expect(result.startTime).toEqual(editStay.startTime);

					// check db
					const items = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.sk === 'STAY#' + result.id);
					expect(saved.pk).toEqual('ROOM#' + roomId);
					expect(saved.startTime.toISOString()).toEqual(editStay.startTime);
					expect(saved.endTime).toBeUndefined();
				});
		});

		test('Update existing room with startTime and endTime should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const editStay = { startTime: now.toISOString(), endTime: now.toISOString() };

			return agent
				.patch('/stays/' + stayId)
				.send(editStay)
				.expect(200)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.roomId).toEqual(roomId);
					expect(result.startTime).toEqual(editStay.startTime);
					expect(result.endTime).toEqual(editStay.endTime);

					// check db
					const items = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.sk === 'STAY#' + result.id);
					expect(saved.pk).toEqual('ROOM#' + roomId);
					expect(saved.startTime.toISOString()).toEqual(editStay.startTime);
					expect(saved.endTime.toISOString()).toEqual(editStay.endTime);
				});
		});
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
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.delete('/stays/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Delete existing stay with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.delete('/stays/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Delete existing stay with correct id should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

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
