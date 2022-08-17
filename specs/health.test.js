const supertest = require('supertest');
const app = require('../app');

const agent = supertest.agent(app);

describe('GET /', () => {
	test('It should be live', () =>
		agent
			.get('/')
			.expect(200)
			.then(res => {
				expect(res.body.message).toBe('RestAPI is alive!');
			}));
});

describe('GET /not_found', () => {
	test('Inexistent routes should be Not Found', () =>
		agent
			.get('/not_found')
			.expect(404)
			.then(res => {
				expect(res.body).toMatchObject({ message: 'Not found', data: {}, error: 404 });
			}));
});

describe('GET /health', () => {
	test('Requst should have a parameter', () =>
		agent
			.get('/health')
			.expect(404)
			.then(res => {
				expect(res.body).toMatchObject({ message: 'Not found', data: {}, error: 404 });
			}));

	test('Id parameter as string should be validationError', () =>
		agent
			.get('/health/string')
			.expect(400)
			.then(res => {
				expect(res.body).toEqual(expect.objectContaining({ error: 200, data: '/id' }));
			}));

	test('Id 5 should be ok', () =>
		agent
			.get('/health/5')
			.expect(200)
			.then(res => {
				expect(res.body).toBe(5);
			}));

	test('Id 100 should be BadRequest', () =>
		agent
			.get('/health/100')
			.expect(400)
			.then(res => {
				expect(res.body).toMatchObject({ message: 'Bad request', data: {}, error: 400 });
			}));
});
