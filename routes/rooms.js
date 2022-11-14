const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const { get, getById, add, update, del } = require('../controllers/rooms');

const router = express.Router();

router.get('/', isAuth, get);

router.get('/:id', validator({ params: 'room' }), isAuth, getById);

router.post('/', validator({ body: 'addRoom' }), isAuth, add);

router.patch('/:id', validator({ params: 'room', body: 'addRoom' }), isAuth, update);

router.delete('/:id', validator({ params: 'room' }), isAuth, del);

module.exports = router;
