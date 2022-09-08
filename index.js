const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (process.env.ENV === 'dev' && fs.existsSync(path.resolve(__dirname, '.env.development'))) {
	dotenv.config({ path: path.resolve(__dirname, '.env.development') });
} else {
	dotenv.config();
}

const app = require('./app');
require('./db/connect');

app.listen(process.env.PORT || 3000);
