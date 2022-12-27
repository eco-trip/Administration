const supertest = require('supertest');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');
const {
	createHotel,
	createRoom,
	isAuthUnautorized,
	isAuthAdmin,
	isAuthHotelier,
	uuidValidate
} = require('../test/utils');
const { isAuth } = require('../middlewares/isAuth');

const { Hotel } = require('../model/Hotel');
const { Room } = require('../model/Room');

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

		test('Get all should contains just one hotel with serialized fields', async () => {
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.get('/hotels/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Get hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.get('/hotels/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Get hotel with correct id should contain serialized fields', async () => {
			isAuth.mockImplementation(isAuthAdmin);

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

	describe('GET /hotels/:id/rooms', () => {
		test('Get rooms of the hotel without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			return agent
				.get('/hotels/' + hotelId + '/rooms')
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Get rooms of the hotel with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.get('/hotels/123/rooms')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Get rooms of the hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.get('/hotels/' + uuidv1() + '/rooms')
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Get rooms of the hotel with correct id should contain zero room', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.get('/hotels/' + hotelId + '/rooms')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(0);
				});
		});

		test('Get rooms of the hotel with correct id should contain one room', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const roomId = uuidv1();
			const room = await createRoom(roomId, hotelId, { floor: 1, number: '101' });

			return agent
				.get('/hotels/' + hotelId + '/rooms')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(1);

					const result = res.body[0];
					expect(result.id).toEqual(room.sk.replace('ROOM#', ''));
					expect(result.hotelId).toEqual(room.pk.replace('HOTEL#', ''));
					expect(result.floor).toEqual(room.floor);
					expect(result.number).toEqual(room.number);
				});
		});

		test('Get rooms of the hotel with correct id should contain two rooms', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const room1 = await createRoom(uuidv1(), hotelId, { floor: 1, number: '101' });
			const room2 = await createRoom(uuidv1(), hotelId, { floor: 2, number: '202' });

			return agent
				.get('/hotels/' + hotelId + '/rooms')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(2);

					expect(res.body[0].id).toEqual(room1.sk.replace('ROOM#', ''));
					expect(res.body[0].hotelId).toEqual(room1.pk.replace('HOTEL#', ''));
					expect(res.body[0].floor).toEqual(room1.floor);
					expect(res.body[0].number).toEqual(room1.number);

					expect(res.body[1].id).toEqual(room2.sk.replace('ROOM#', ''));
					expect(res.body[1].hotelId).toEqual(room2.pk.replace('HOTEL#', ''));
					expect(res.body[1].floor).toEqual(room2.floor);
					expect(res.body[1].number).toEqual(room2.number);
				});
		});
	});

	describe('PUT /hotels/:id/rooms', () => {
		test('Put new room for the hotel without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const newRoom = { floor: 1, number: '101' };

			return agent
				.put('/hotels/' + hotelId + '/rooms')
				.send(newRoom)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Put new room for the hotel with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newRoom = { floor: 1, number: '101' };

			return agent
				.put('/hotels/123/rooms')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Put new room for the hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newRoom = { floor: 1, number: '101' };

			return agent
				.put('/hotels/' + uuidv1() + '/rooms')
				.send(newRoom)
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Put new room for the hotel without floor should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newRoom = { number: '101' };

			return agent
				.put('/hotels/' + hotelId + '/rooms')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/floor' }));
				});
		});

		test('Put new room for the hotel without number should be MissingRequiredParameter', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newRoom = { floor: 1 };

			return agent
				.put('/hotels/' + hotelId + '/rooms')
				.send(newRoom)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 201, data: '/number' }));
				});
		});

		test('Put new room for the hotel with correct id should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newRoom = { floor: 1, number: '101' };

			return agent
				.put('/hotels/' + hotelId + '/rooms')
				.send(newRoom)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.floor).toEqual(newRoom.floor);
					expect(result.number).toEqual(newRoom.number);
					expect(result.hotelId).toEqual(hotelId);

					// check db
					const items = await Room.scan().filter('sk').beginsWith('ROOM#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.sk === 'ROOM#' + result.id);
					expect(saved.pk).toEqual('HOTEL#' + hotelId);
					expect(saved.floor).toEqual(newRoom.floor);
					expect(saved.number).toEqual(newRoom.number);
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
			isAuth.mockImplementation(isAuthAdmin);

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
			isAuth.mockImplementation(isAuthAdmin);

			const newHotel = { title: 'New Hotel' };

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/title' }));
				});
		});

		test('Add new hotel with invalid country should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newHotel = { name: 'New Hotel', country: 'ITALY' };

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200, data: '/country' }));
				});
		});

		test('Add new hotel with correct data should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newHotel = { name: 'New Hotel' };

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.name).toEqual(newHotel.name);

					// check db
					const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
					expect(items.length).toEqual(2);
					const saved = items.find(e => e.pk === 'HOTEL#' + result.id);
					expect(saved.sk).toEqual('METADATA#' + result.id);
					expect(saved.name).toEqual(newHotel.name);
				});
		});

		test('Add new hotel with all allowed fields data should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const newHotel = {
				name: 'Edit Hotel',
				description: 'description',
				cost: 10,
				country: 'IT',
				city: 'Fano',
				address: 'Via Roma 1',
				zipcode: '61032'
			};

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.name).toEqual(newHotel.name);
					expect(result.description).toEqual(newHotel.description);
					expect(result.cost).toEqual(newHotel.cost);
					expect(result.country).toEqual(newHotel.country);
					expect(result.city).toEqual(newHotel.city);
					expect(result.address).toEqual(newHotel.address);
					expect(result.zipcode).toEqual(newHotel.zipcode);

					// check db
					const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
					expect(items.length).toEqual(2);
					const saved = items.find(e => e.pk === 'HOTEL#' + result.id);
					expect(saved.sk).toEqual('METADATA#' + result.id);
					expect(saved.name).toEqual(newHotel.name);
					expect(saved.description).toEqual(newHotel.description);
					expect(saved.cost).toEqual(newHotel.cost);
					expect(saved.country).toEqual(newHotel.country);
					expect(saved.city).toEqual(newHotel.city);
					expect(saved.address).toEqual(newHotel.address);
					expect(saved.zipcode).toEqual(newHotel.zipcode);
				});
		});
	});

	describe('PATCH /hotels/:id', () => {
		test('Update existing hotel without access token should be Unauthorized', async () => {
			isAuth.mockImplementation(isAuthUnautorized);

			const editHotel = { name: 'Edit Hotel' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(editHotel)
				.expect(401)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
				});
		});

		test('Update existing hotel with invalid id should be ValidationError', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.patch('/hotels/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Update existing hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.patch('/hotels/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Update existing hotel with unknown field should be AdditionalParameters not permetted', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const editHotel = { title: 'Edit Hotel' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(editHotel)
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 202, data: '/title' }));
				});
		});

		test('Update existing hotel with invalid country should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const editHotel = { country: 'ITALY' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(editHotel)
				.expect(400)
				.then(async res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200, data: '/country' }));
				});
		});

		test('Update existing hotel with correct data should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const editHotel = { name: 'Edit Hotel' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(editHotel)
				.expect(200)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.name).toEqual(editHotel.name);

					// check db
					const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.pk === 'HOTEL#' + hotelId);
					expect(saved.sk).toEqual('METADATA#' + hotelId);
					expect(saved.name).toEqual(editHotel.name);
				});
		});

		test('Update existing hotel with all allowed fields should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			const editHotel = {
				name: 'Edit Hotel',
				description: 'description',
				cost: 10,
				country: 'IT',
				city: 'Fano',
				address: 'Via Roma 1',
				zipcode: '61032'
			};

			return agent
				.patch('/hotels/' + hotelId)
				.send(editHotel)
				.expect(200)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.name).toEqual(editHotel.name);
					expect(result.description).toEqual(editHotel.description);
					expect(result.cost).toEqual(editHotel.cost);
					expect(result.country).toEqual(editHotel.country);
					expect(result.city).toEqual(editHotel.city);
					expect(result.address).toEqual(editHotel.address);
					expect(result.zipcode).toEqual(editHotel.zipcode);

					// check db
					const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.pk === 'HOTEL#' + hotelId);
					expect(saved.name).toEqual(editHotel.name);
					expect(saved.description).toEqual(editHotel.description);
					expect(saved.cost).toEqual(editHotel.cost);
					expect(saved.country).toEqual(editHotel.country);
					expect(saved.city).toEqual(editHotel.city);
					expect(saved.address).toEqual(editHotel.address);
					expect(saved.zipcode).toEqual(editHotel.zipcode);
				});
		});
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
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.delete('/hotels/123')
				.expect(400)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 200 }));
				});
		});

		test('Delete existing hotel with inexistent id should be NotFound', async () => {
			isAuth.mockImplementation(isAuthAdmin);

			return agent
				.delete('/hotels/' + uuidv1())
				.expect(404)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
				});
		});

		test('Delete existing hotel with correct id should be ok', async () => {
			isAuth.mockImplementation(isAuthAdmin);

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

/*
Hotelier role
*/

describe('Role: hotelier', () => {
	describe('GET /hotels', () => {
		test('Get all hotels should be Forbidden', async () => {
			isAuth.mockImplementation(isAuthHotelier(uuidv1()));

			return agent
				.get('/hotels')
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});
	});

	describe('GET /hotels/:id', () => {
		test('Get hotel not of the hotelier should be Forbidden', async () => {
			isAuth.mockImplementation(isAuthHotelier(uuidv1()));

			return agent
				.get('/hotels/' + hotelId)
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});

		test("Get hotelier's own hotel should be ok", async () => {
			isAuth.mockImplementation(isAuthHotelier(hotelId));

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

	describe('GET /hotels/:id/rooms', () => {
		test('Get rooms of the hotel not of the hotelier should be Forbidden', async () => {
			isAuth.mockImplementation(isAuthHotelier(uuidv1()));

			const roomId = uuidv1();
			await createRoom(roomId, hotelId, { floor: 1, number: '101' });

			return agent
				.get('/hotels/' + hotelId + '/rooms')
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});

		test("Get rooms of the hotelier's own hotel should be ok", async () => {
			isAuth.mockImplementation(isAuthHotelier(hotelId));

			const roomId = uuidv1();
			const room = await createRoom(roomId, hotelId, { floor: 1, number: '101' });

			return agent
				.get('/hotels/' + hotelId + '/rooms')
				.expect(200)
				.then(res => {
					expect(res.body.length).toBe(1);

					const result = res.body[0];
					expect(result.id).toEqual(room.sk.replace('ROOM#', ''));
					expect(result.hotelId).toEqual(room.pk.replace('HOTEL#', ''));
					expect(result.floor).toEqual(room.floor);
					expect(result.number).toEqual(room.number);
				});
		});
	});

	describe('PUT /hotels/:id/rooms', () => {
		test('Put new room in the hotel not of the hotelier should be Forbidden', async () => {
			isAuth.mockImplementation(isAuthHotelier(uuidv1()));

			const newRoom = { floor: 1, number: '101' };

			return agent
				.put('/hotels/' + hotelId + '/rooms')
				.send(newRoom)
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});

		test("Put new room in the hotelier's own hotel should be ok", async () => {
			isAuth.mockImplementation(isAuthHotelier(hotelId));

			const newRoom = { floor: 1, number: '101' };

			return agent
				.put('/hotels/' + hotelId + '/rooms')
				.send(newRoom)
				.expect(201)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.floor).toEqual(newRoom.floor);
					expect(result.number).toEqual(newRoom.number);
					expect(result.hotelId).toEqual(hotelId);

					// check db
					const items = await Room.scan().filter('sk').beginsWith('ROOM#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.sk === 'ROOM#' + result.id);
					expect(saved.pk).toEqual('HOTEL#' + hotelId);
					expect(saved.floor).toEqual(newRoom.floor);
					expect(saved.number).toEqual(newRoom.number);
				});
		});
	});

	describe('POST /hotels', () => {
		test('Add new hotel should be Forbidden', async () => {
			isAuth.mockImplementation(isAuthHotelier(uuidv1()));

			const newHotel = { name: 'New Hotel' };

			return agent
				.post('/hotels/')
				.send(newHotel)
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});
	});

	describe('PATCH /hotels/:id', () => {
		test('Update existing hotel not of the hotelier should be Forbidden', async () => {
			isAuth.mockImplementation(isAuthHotelier(uuidv1()));

			const editHotel = { name: 'Edit Hotel' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(editHotel)
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});

		test("Update existing hotelier's own hotel should be ok", async () => {
			isAuth.mockImplementation(isAuthHotelier(hotelId));

			const editHotel = { name: 'Edit Hotel' };

			return agent
				.patch('/hotels/' + hotelId)
				.send(editHotel)
				.expect(200)
				.then(async res => {
					const result = res.body;
					expect(uuidValidate().test(result.id)).toBe(true);
					expect(result.name).toEqual(editHotel.name);

					// check db
					const items = await Hotel.scan().filter('sk').beginsWith('METADATA#').exec();
					expect(items.length).toEqual(1);
					const saved = items.find(e => e.pk === 'HOTEL#' + hotelId);
					expect(saved.sk).toEqual('METADATA#' + hotelId);
					expect(saved.name).toEqual(editHotel.name);
				});
		});
	});

	describe('DELETE /hotels/:id', () => {
		test('Delete existing hotel not of the hotelier should be Forbidden', async () => {
			isAuth.mockImplementation(isAuthHotelier(uuidv1()));

			return agent
				.delete('/hotels/' + hotelId)
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});

		test("Delete existing hotelier's own hotel should be Forbidden", async () => {
			isAuth.mockImplementation(isAuthHotelier(hotelId));

			return agent
				.delete('/hotels/' + hotelId)
				.expect(403)
				.then(res => {
					expect(res.body).toEqual(expect.objectContaining({ error: 403 }));
				});
		});
	});
});
