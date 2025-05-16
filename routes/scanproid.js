const express = require('express');
const router = express.Router();
const {scanProductId} = require('../controllers/scanproid.controller');

router.post('/scan-product-id', scanProductId);

module.exports = router;