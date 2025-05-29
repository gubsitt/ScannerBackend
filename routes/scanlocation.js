const express = require('express');
const router = express.Router();
const scanlocationController = require('../controllers/scanlocation.controller');

router.get('/scan-location', scanlocationController.getProductsByLocation);

module.exports = router;