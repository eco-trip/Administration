const supertest = require('supertest');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');
const { createHotel, createRoom, isAuthUnautorized, isAuthOk, uuidValidate } = require('../test/utils');
const { isAuth } = require('../middlewares/isAuth');

const { Room } = require('../model/Room');

const app = require('../app');

jest.mock('../helpers/cognito');
jest.mock('../middlewares/isAuth');

let agent;
let hotel;
let room;

const hotelId = uuidv1();
const roomId = uuidv1();

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

		test('Add new room with correct data should be Ok', async () => {
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

		test.todo('Update existing room with correct data should be Ok');
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

		test('Delete existing room with correct id should be Ok', async () => {
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
