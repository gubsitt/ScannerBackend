const express = require('express');
const router = express.Router();
const { getWprData,getWprDetail } = require('../controllers/wprController');

router.get('/wprHead', getWprData);
router.get('/wprDetail/:reqNo', getWprDetail);

module.exports = router;
