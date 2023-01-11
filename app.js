/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');

const response = require('./middlewares/response');
const trimmer = require('./middlewares/trimmer');

const { SendData, NotFound } = require('./helpers/response');

const app = express();

const server = createServer(app);

app.use(
	cors({
		credentials: true,
		origin: [process.env.CP_CORS_ORIGIN, process.env.APP_CORS_ORIGIN],
		allowedHeaders: ['content-type', 'Authorization'],
		exposedHeaders: ['x-total-count', 'x-last-updatedat']
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(trimmer());
app.get('/', (req, res, next) => next(SendData({ message: 'RestAPI is alive!' })));

// dynamic routes for express
fs.readdirSync(path.join(__dirname, '/routes'))
	.filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js')
	.forEach(file => {
		const f = path.parse(file).name;
		app.use(`/${f}`, require(`./routes/${f}`));
	});

app.all('*', (req, res, next) => next(NotFound()));

app.use((toSend, req, res, next) => response(toSend, res));

module.exports = server;
