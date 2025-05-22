const { sql, poolPromise } = require('../config/dbConfig');

exports.scanProductId = async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'กรุณาระบุ ProductID' });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('productId', sql.VarChar, productId)
      .query('SELECT * FROM View_StockBalance WHERE F_ProductID = @productId');
    if (result.recordset.length === 0) {
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
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};