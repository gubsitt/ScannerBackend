const express = require('express');
const router = express.Router();
const { scanSerialNumber,getScannedByOrder,getAllScannedSNs,deleteScannedSN } = require('../controllers/scan.controller');


router.post('/scan-sn', scanSerialNumber);
router.get('/scanned/:saleOrderNo', getScannedByOrder);
router.get('/scanned-all', getAllScannedSNs);
router.delete('/delete-scanned', deleteScannedSN);

module.exports = router;
