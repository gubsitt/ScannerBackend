const express = require('express');
const router = express.Router();
const {searchOrder,searchOrderDetails,searchScannedSN} = require('../controllers/search.controller');

router.get('/search-orders',searchOrder );
router.get('/search-orderdetails', searchOrderDetails);
router.get('/search-scanned-sn', searchScannedSN);

module.exports = router;