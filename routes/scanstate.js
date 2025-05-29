const express = require('express');
const router = express.Router();
const scanstateController = require('../controllers/scanstate.controller');

router.get('/scan-state', scanstateController.getProcessOrderDetail);

module.exports = router;