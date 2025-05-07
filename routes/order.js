const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getOrders, getOrder} = require('../controllers/order.controller');

router.get('/orders', getOrders);
router.get('/orders/:saleOrderNo', getOrder);


module.exports = router;
