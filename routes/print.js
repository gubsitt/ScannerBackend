const express = require('express');
const router = express.Router();
const printController = require('../controllers/print.controller');

router.post('/print', printController.printAndLog);

module.exports = router;