const express = require('express');
const router = express.Router();
const { changeLocation } = require('../controllers/changelocation.controller');

router.post('/change-location', changeLocation);

module.exports = router;