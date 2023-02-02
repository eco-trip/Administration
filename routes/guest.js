const express = require('express');

const { isGuestJwt } = require('../middlewares/isGuestJwt');
const { get } = require('../controllers/guest');

const router = express.Router();

router.get('/', isGuestJwt, get);

module.exports = router;
