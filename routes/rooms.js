const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const { get, getById, getStays, putStay, add, update, del } = require('../controllers/rooms');

const router = express.Router();

router.get('/', isAuth, rbac('rooms', 'read:any'), get);
router.get('/:id', isAuth, validator({ params: 'uuid' }), rbac('rooms', 'read'), getById);
router.post('/', isAuth, validator({ body: 'addRoom' }), rbac('rooms', 'create'), add);
router.patch('/:id', isAuth, validator({ params: 'uuid', body: 'room' }), rbac('rooms', 'update'), update);
router.delete('/:id', isAuth, validator({ params: 'uuid' }), rbac('rooms', 'delete'), del);

router.get('/:id/stays', isAuth, validator({ params: 'uuid' }), rbac('stays', 'read'), getStays);
router.put('/:id/stays', isAuth, validator({ params: 'uuid', body: 'putStay' }), rbac('stays', 'create'), putStay);

module.exports = router;
