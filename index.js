require('dotenv').config();

const app = require('./app');
require('./db/connect');

app.listen(process.env.PORT || 3000);
