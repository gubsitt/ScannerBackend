const express = require('express');
const router = express.Router();
const {searchOrder,searchOrderDetails,searchScannedSN,searchStockBalance} = require('../controllers/search.controller');

router.get('/search-orders',searchOrder );
router.get('/search-orderdetails', searchOrderDetails);
router.get('/search-scanned-sn', searchScannedSN);
router.get('/search-product-changelocation',searchStockBalance );

module.exports = router;