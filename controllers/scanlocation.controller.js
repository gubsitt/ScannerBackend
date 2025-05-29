const { sql, poolPromise } = require('../config/dbConfig');

exports.getProductsByLocation = async (req, res) => {
  const { location } = req.query;
  console.log('📥 รับค่า location:', location); 

  if (!location) {
    console.warn('⚠️ ไม่ได้ระบุ location');
    return res.status(400).json({ error: 'กรุณาระบุ location' });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('location', sql.VarChar, location)
      .query(`
        SELECT F_ProductId, F_ProductName, F_Location, F_TypeStock, F_StockBalance, F_ProductBrandName, F_ProductGroupName, F_UnitName
        FROM View_StockBalance
        WHERE F_Location = @location
      `);

    console.log('📦 ผลลัพธ์ที่ query ได้:', result.recordset); 

    if (result.recordset.length === 0) {
      console.warn('❌ ไม่พบข้อมูลสินค้าใน Location นี้');
      return res.status(404).json({ error: 'ไม่พบข้อมูลสินค้าใน Location นี้' });
    }
    res.json(result.recordset);
  } catch (err) {
    console.error('💥 error:', err);
    res.status(500).json({ error: err.message });
  }
};