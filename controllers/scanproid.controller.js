const { sql, poolPromise } = require('../config/dbConfig');

exports.scanProductId = async (req, res) => {
  const { productId } = req.body;
  console.log('📥 POST /scanProductId:', req.body);

  if (!productId) {
    console.warn('⚠️ Missing ProductID in request');
    return res.status(400).json({ error: 'กรุณาระบุ ProductID' });
  }

  try {
    const pool = await poolPromise;

    console.log(`🔍 Searching for productId: ${productId}`);
    const result = await pool.request()
      .input('productId', sql.VarChar, productId)
      .query('SELECT * FROM View_StockBalance WHERE F_ProductID = @productId');

    if (result.recordset.length === 0) {
      console.warn(`❌ ProductID ${productId} not found`);
      return res.status(404).json({ error: 'ไม่พบข้อมูลสินค้า' });
    }

    const items = result.recordset.map(row => {
      const productId = row.F_ProductId || row.F_ProductID;
      return {
        ...row,
        imagePath: productId
          ? `http://172.16.10.8/${productId}/${productId}-WDFile.jpg`
          : null
      };
    });

    console.log(`✅ Found ${items.length} item(s) for productId: ${productId}`);
    res.json(items);
  } catch (err) {
    console.error('💥 Error in scanProductId:', err);
    res.status(500).json({ error: err.message });
  }
};
