const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const { get, getById, getRooms, putRoom, add, update, del, getUser, putUser } = require('../controllers/hotels');

const router = express.Router();

router.get('/', isAuth, rbac('hotels', 'read:any'), get);
router.get('/:id', isAuth, validator({ params: 'uuid' }), rbac('hotels', 'read'), getById);
router.post('/', isAuth, validator({ body: 'addHotel' }), rbac('hotels', 'create'), add);
router.patch('/:id', isAuth, validator({ params: 'uuid', body: 'hotel' }), rbac('hotels', 'update'), update);
router.delete('/:id', isAuth, validator({ params: 'uuid' }), rbac('hotels', 'delete'), del);

router.get('/:id/rooms', isAuth, validator({ params: 'uuid' }), rbac('rooms', 'read'), getRooms);
router.put('/:id/rooms', isAuth, validator({ params: 'uuid', body: 'putRoom' }), rbac('rooms', 'create'), putRoom);

router.get('/:id/user', isAuth, validator({ params: 'uuid' }), rbac('users', 'read'), getUser);
router.put('/:id/user', isAuth, validator({ params: 'uuid', body: 'putUser' }), rbac('users', 'create'), putUser);

module.exports = router;
