const express = require('express');
const { check } = require('../controllers/health');
const { validator } = require('../middlewares/validator');

const router = express.Router();

router.get('/:id', validator({ params: 'healthId' }), check);

module.exports = router;
