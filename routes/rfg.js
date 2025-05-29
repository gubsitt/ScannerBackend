const express = require('express');
const router = express.Router();
const rfgController = require('../controllers/rfg.controller');

router.get('/all-rfg', rfgController.getAllRFG);
router.post('/update-location-rfg', rfgController.updateLocation);
router.post('/confirm-stock-checked-rfg', rfgController.confirmStockChecked);



module.exports = router;