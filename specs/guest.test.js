const supertest = require('supertest');
const { v1: uuidv1 } = require('uuid');

require('../db/connect');
const { clear } = require('../test/clear');
const { createHotel, createRoom, createStay } = require('../test/utils');

const { signJwt } = require('../controllers/guest');

const app = require('../app');

jest.mock('../helpers/cognito');
jest.mock('../middlewares/isAuth');

let agent;
let hotel;
let room;
let stay;

const hotelId = uuidv1();
const roomId = uuidv1();
const stayId = uuidv1();

const now = new Date();

beforeEach(async () => {
	agent = supertest.agent(app);
	await clear();

	hotel = await createHotel(hotelId, { name: 'Hotel Name' });
	room = await createRoom(roomId, hotelId, { floor: 1, number: '101' });
	stay = await createStay(stayId, roomId, { startTime: now });
});
afterEach(() => jest.clearAllMocks());

describe('GET /guest', () => {
	test('Get stay as guest without jwt should be MissingRequiredParameter', async () =>
		agent
			.get('/guest')
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 201 }));
			}));

	test('Get stay as guest with invalid jwt should be Unauthorized', async () => {
		const token = '123';

		await agent
			.get('/guest')
			.set('Authorization', `Bearer ${token}`)
			.expect(401)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
			});

		const token2 =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGF5SWQiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjJ9.lXeiE_fw1G5dGxMw2vjES6-nSZfurDW49p2m-3U84RU';

		return agent
			.get('/guest')
			.set('Authorization', `Bearer ${token2}`)
			.expect(401)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 401 }));
			});
	});

	test('Get stay as guest with valid jwt but wrong stayID in payload should be NotFound', async () => {
		const token = signJwt('123');

		return agent
			.get('/guest')
			.set('Authorization', `Bearer ${token}`)
			.expect(404)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 404 }));
			});
	});

	test('Get stay as guest with valid jwt should be ok', async () => {
		const token = signJwt(stayId);

		return agent
			.get('/guest')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.then(res => {
				const result = res.body;

				expect(result.hotel.name).toEqual(hotel.name);
				expect(result.hotel.id).toEqual(hotel.pk.replace('HOTEL#', ''));

				expect(result.room.id).toEqual(room.sk.replace('ROOM#', ''));
				expect(result.room.number).toEqual(room.number);
				expect(result.room.floor).toEqual(room.floor);

				expect(result.stay.id).toEqual(stay.sk.replace('STAY#', ''));
				expect(result.stay.startTime).toEqual(new Date(stay.startTime).toISOString());
			});
	});
});
