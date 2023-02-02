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
