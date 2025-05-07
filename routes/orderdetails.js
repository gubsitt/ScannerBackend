const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getOrderDetails } = require('../controllers/orderdetails.controller');

router.get('/orderdetails/:saleOrderNo', getOrderDetails);

module.exports = router;
