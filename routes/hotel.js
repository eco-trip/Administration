const express = require('express');
const { validator } = require('../middlewares/validator');
const { get, getById, add, update, del } = require('../controllers/hotels');

const router = express.Router();

router.get('/', get);

router.get('/:id', validator({ params: 'hotel' }), getById);

router.post('/', validator({ params: 'hotel', body: 'addHotel' }), add);

router.patch('/:id', validator({ params: 'hotel', body: 'addHotel' }), update);

router.delete('/:id', validator({ params: 'hotel' }), del);

module.exports = router;
