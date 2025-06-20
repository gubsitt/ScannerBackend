const express = require('express');
const router = express.Router();
const orderAllDetailsController = require('../controllers/orderalldetail.controller');

router.get('/orderalldetail/:saleOrderNo', orderAllDetailsController.getOrderAllDetails);

module.exports = router;