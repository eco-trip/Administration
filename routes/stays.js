const express = require('express');
const { validator } = require('../middlewares/validator');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const { get, getById, add, update, del } = require('../controllers/stays');

const router = express.Router();

router.get('/', isAuth, rbac('stays', 'read:any'), get);
router.get('/:id', isAuth, validator({ params: 'uuid' }), rbac('stays', 'read'), getById);
router.post('/', isAuth, validator({ body: 'addStay' }), rbac('stays', 'create'), add);
router.patch('/:id', isAuth, validator({ params: 'uuid', body: 'stay' }), rbac('stays', 'update'), update);
router.delete('/:id', isAuth, validator({ params: 'uuid' }), rbac('stays', 'delete'), del);

module.exports = router;
