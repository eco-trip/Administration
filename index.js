const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.ENV || 'development'}`) });

const app = require('./app');
require('./db/connect');

app.listen(process.env.PORT || 3000);
