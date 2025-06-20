const express = require('express');
const router = express.Router();
const pickupController = require('../controllers/pickup.controller');

router.post('/pickup', pickupController.updatePickupStatus);
router.post('/pickup-cancel', pickupController.cancelPickupStatus);


module.exports = router;
