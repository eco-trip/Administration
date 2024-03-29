const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const { login, check, register } = require('../controllers/auth');

const router = express.Router();

router.post('/register', validator('registerAuth'), register);

router.post('/login', validator('loginAuth'), login);

router.get('/check', isAuth, check);

module.exports = router;
