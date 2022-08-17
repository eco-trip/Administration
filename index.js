const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.ENV || 'development'}`) });
dotenv.config();

const app = require('./app');

app.listen(process.env.PORT || 3000);
