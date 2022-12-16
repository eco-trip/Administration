const supertest = require('supertest');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');
const { createHotel, createRoom, createStay, isAuthUnautorized, isAuthOk, uuidValidate } = require('../test/utils');
const { isAuth } = require('../middlewares/isAuth');

const { Room } = require('../model/Room');
const { Stay } = require('../model/Stay');

const app = require('../app');

jest.mock('../helpers/cognito');
jest.mock('../middlewares/isAuth');

let agent;
let hotel;
let room;

const hotelId = uuidv1();
const roomId = uuidv1();

const now = new Date();

beforeEach(async () => {
	agent = supertest.agent(app);
	await clear();

	hotel = await createHotel(hotelId, { name: 'Hotel Name' });
	room = await createRoom(roomId, hotelId, { floor: 1, number: '101' });
});
afterEach(() => jest.clearAllMocks());

describe('Role: admin', () => {
	describe('GET /rooms', () => {
		test('Get all rooms without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/rooms')
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get all should contains just one room with serialized fields', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/rooms')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(1);

					const result = res.body[0];
					expect(result.id).toEqual(room.sk.replace('ROOM#', ''));
					expect(result.hotelId).toEqual(hotel.pk.replace('HOTEL#', ''));
					expect(result.floor).toEqual(room.floor);
					expect(result.number).toEqual(room.number);
				});
		});
	});

	describe('GET /rooms/:id', () => {
		test('Get room without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/rooms/' + roomId)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get room with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/rooms/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Get room with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/rooms/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Get room with correct id should contain serialized fields', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/rooms/' + roomId)
				.expect(200)
				.then(res => {
					const result = res.body;

					expect(result.id).toEqual(room.sk.replace('ROOM#', ''));
					expect(result.hotelId).toEqual(hotel.pk.replace('HOTEL#', ''));
					expect(result.floor).toEqual(room.floor);
					expect(result.number).toEqual(room.number);
				});
		});
	});

	describe('GET /rooms/:id/stays', () => {
		test('Get stays of the room without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/rooms/' + hotelId + '/stays')
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get stays of the room with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/rooms/123/stays')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Get stays of the room with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.get('/rooms/' + uuidv1() + '/stays')
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Get stays of the room with correct id should contain one stay', async () => {
			isAuth.mockImplementation(isAuthOk);

			const stayId = uuidv1();
			const stay = await createStay(stayId, roomId, { startTime: now });

			return agent
				.get('/rooms/' + roomId + '/stays')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(1);

					const result = res.body[0];
					expect(result.id).toEqual(stay.sk.replace('STAY#', ''));
					expect(result.roomId).toEqual(stay.pk.replace('ROOM#', ''));
					expect(result.startTime).toEqual(now.toISOString());
				});
		});

		test('Get stays of the room with correct id should contain two stays', async () => {
			isAuth.mockImplementation(isAuthOk);

			const stay1 = await createStay(uuidv1(), roomId, { startTime: now });
			const stay2 = await createStay(uuidv1(), roomId, { startTime: now });

			return agent
				.get('/rooms/' + roomId + '/stays')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(2);

					expect(res.body[0].id).toEqual(stay1.sk.replace('STAY#', ''));
					expect(res.body[0].roomId).toEqual(stay1.pk.replace('ROOM#', ''));
					expect(res.body[0].startTime).toEqual(now.toISOString());

					expect(res.body[1].id).toEqual(stay2.sk.replace('STAY#', ''));
					expect(res.body[1].roomId).toEqual(stay2.pk.replace('ROOM#', ''));
					expect(res.body[1].startTime).toEqual(now.toISOString());
				});
		});
	});

	describe('PUT /rooms/:id/stays', () => {
		test('Put new stay for the room without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newStay = { startTime: now.toISOString() };

			return agent
				.put('/rooms/' + roomId + '/stays')
				.send(newStay)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Put new stay for the room with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { startTime: now.toISOString() };

			return agent
				.put('/rooms/123/stays')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Put new stay for the room with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { startTime: now.toISOString() };

			return agent
				.put('/rooms/' + uuidv1() + '/stays')
				.send(newStay)
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Put new stay for the room without startTime should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = {};

			return agent
				.put('/rooms/' + roomId + '/stays')
				.send(newStay)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/startTime' }));
				});
		});

		test('Put new stay for the room with correct id should be ok', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newStay = { startTime: now.toISOString() };

			return agent
				.put('/rooms/' + roomId + '/stays')
				.send(newStay)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.roomId).toEqual(roomId);
					expect(result.startTime).toEqual(newStay.startTime);

					// check db
					const items = await Stay.scan().filter('sk').beginsWith('STAY#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.sk === 'STAY#' + result.id);
					expect(saved.pk).toEqual('ROOM#' + roomId);
					expect(saved.startTime.toISOString()).toEqual(newStay.startTime);
				});
		});
	});

	describe('POST /rooms', () => {
		test('Add new room without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newRoom = { floor: 2, number: '201', hotelId };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Add new room without floor should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { number: '201', hotelId };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/floor' }));
				});
		});

		test('Add new room without number should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { floor: 2, hotelId };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/number' }));
				});
		});

		test('Add new room without hotelId should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { floor: 2, number: '201' };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/hotelId' }));
				});
		});

		test('Add new room with floor as string should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { floor: 'a', number: '201', hotelId };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200, data: '/floor' }));
				});
		});

		test('Add new room with invalid hotelId shouldbe ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { floor: 'a', number: '201', hotelId: '1234abcd' };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200, data: '/hotelId' }));
				});
		});

		test('Add new room with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { name: 2 };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/name' }));
				});
		});

		test('Add new room with correct data should be ok', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { floor: 2, number: '201', hotelId };

			return agent
				.post('/rooms/')
				.send(newRoom)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.floor).toEqual(newRoom.floor);
					expect(result.number).toEqual(newRoom.number);
					expect(result.hotelId).toEqual(newRoom.hotelId);

					// check db
					const items = await Room.scan().filter('sk').beginsWith('ROOM#').exec();
					expect(items.length).toEqual(2);
					const saved = items.find(e => e.number === newRoom.number);
					expect(saved.pk).toEqual('HOTEL#' + hotelId);
					expect(saved.sk).toContain('ROOM#');
				});
		});
	});

	describe('PATCH /rooms/:id', () => {
		test('Update existing room without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newRoom = { floor: 2, number: '201', hotelId };

			return agent
				.patch('/rooms/' + roomId)
				.send(newRoom)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Update existing room with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.patch('/rooms/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Update existing room with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.patch('/rooms/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Update existing room with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthOk);

			const newRoom = { name: 2 };

			return agent
				.patch('/rooms/' + roomId)
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/name' }));
				});
		});

		test.todo('Update existing room with correct data should be ok');
	});

	describe('DELETE /rooms/:id', () => {
		test('Delete existing room without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.delete('/rooms/' + roomId)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Delete existing room with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/rooms/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Delete existing room with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/rooms/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Delete existing room with correct id should be ok', async () => {
			isAuth.mockImplementation(isAuthOk);

			return agent
				.delete('/rooms/' + roomId)
				.expect(200)
				.then(async res => {
					expect(res.body).toEqual('Successfully deleted!');

					// check db
					const items = await Room.scan().filter('sk').beginsWith('ROOM#').exec();
					expect(items.length).toEqual(0);
				});
		});
	});
});
