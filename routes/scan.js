const express = require('express');
const router = express.Router();
const { scanSerialNumber,getScannedByOrder,getAllScannedSNs } = require('../controllers/scan.controller');


router.post('/scan-sn', scanSerialNumber);
router.get('/scanned/:saleOrderNo', getScannedByOrder);
router.get('/scanned-all',getAllScannedSNs);

module.exports = router;
