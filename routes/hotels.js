const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const { get, getById, add, update, del } = require('../controllers/hotels');

const router = express.Router();

router.get('/', isAuth, get);

router.get('/:id', validator({ params: 'uuid' }), isAuth, getById);

router.post('/', validator({ body: 'addHotel' }), isAuth, add);

router.patch('/:id', validator({ params: 'uuid', body: 'hotel' }), isAuth, update);

router.delete('/:id', validator({ params: 'uuid' }), isAuth, del);

module.exports = router;
