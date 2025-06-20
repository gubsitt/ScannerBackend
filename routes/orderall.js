const express = require('express');
const router = express.Router();
const orderAllController = require('../controllers/orderall.controller');

router.get('/getOrdersAll', orderAllController.getOrdersAll);

router.get('/getOrderAll/:saleOrderNo', orderAllController.getOrderAll);

module.exports = router;