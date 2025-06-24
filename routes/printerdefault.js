const express = require('express');
const router = express.Router();
const printerDefaultController = require('../controllers/printerdefault.controller');

router.get('/printerdefault/:reportName', printerDefaultController.getDefaultPrinter);

module.exports = router;