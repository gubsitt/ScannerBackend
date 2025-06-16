const express = require('express');
const router = express.Router();
const printController = require('../controllers/print.controller');

router.post('/print', printController.printAndLog);
router.get('/printers', printController.getPrinters);


module.exports = router;