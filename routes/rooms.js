const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const { get, getById, getStays, putStay, add, update, del } = require('../controllers/rooms');

const router = express.Router();

router.get('/', isAuth, get);
router.get('/:id', isAuth, validator({ params: 'uuid' }), getById);
router.post('/', isAuth, validator({ body: 'addRoom' }), add);
router.patch('/:id', isAuth, validator({ params: 'uuid', body: 'room' }), update);
router.delete('/:id', isAuth, validator({ params: 'uuid' }), del);

router.get('/:id/stays', isAuth, validator({ params: 'uuid' }), getStays);
router.put('/:id/stays', isAuth, validator({ params: 'uuid', body: 'putStay' }), putStay);

module.exports = router;
