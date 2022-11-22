const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const { get, getById, add, update, del } = require('../controllers/hotels');

const router = express.Router();

router.get('/', isAuth, get);

router.get('/:id', isAuth, validator({ params: 'uuid' }), getById);

router.post('/', isAuth, validator({ body: 'addHotel' }), add);

router.patch('/:id', isAuth, validator({ params: 'uuid', body: 'hotel' }), update);

router.delete('/:id', isAuth, validator({ params: 'uuid' }), del);

module.exports = router;
