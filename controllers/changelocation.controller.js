const { sql, poolPromise } = require('../config/dbConfig');

exports.changeLocation = async (req, res) => {
  const { productId, newLocation, employeeId } = req.body;

  console.log('📥 Request body:', req.body);

  if (!productId || !newLocation) {
    console.warn('⚠️ Missing productId or newLocation');
    return res.status(400).json({ error: 'กรุณาระบุ ProductID และ Location ใหม่' });
  }

  try {
    const pool = await poolPromise;

    console.log(`🔍 Checking if location ${newLocation} exists...`);
    const locationResult = await pool.request()
      .input('locationId', sql.VarChar, newLocation)
      .query('SELECT 1 FROM Sys_Location WHERE F_LocationId = @locationId');

    console.log('📦 Location check result:', locationResult.recordset);

    if (locationResult.recordset.length === 0) {
      console.warn('❌ Location not found:', newLocation);
      return res.status(404).json({ error: 'ไม่พบ Location นี้ในระบบ' });
    }

    console.log(`🔍 Checking if product ${productId} exists...`);
    const result = await pool.request()
      .input('productId', sql.VarChar, productId)
      .query('SELECT COUNT(*) AS count FROM Sys_Product WHERE F_ProductID = @productId');

    console.log('📦 Product existence result:', result.recordset);

    const productExists = result.recordset[0].count > 0;
    if (!productExists) {
      console.warn('❌ Product not found:', productId);
      return res.status(404).json({ error: 'ไม่พบสินค้า ProductID ที่ระบุ' });
    }

    console.log(`📝 Updating product ${productId} to new location ${newLocation}...`);
    await pool.request()
      .input('productId', sql.VarChar, productId)
      .input('newLocation', sql.VarChar, newLocation)
      .query('UPDATE Sys_Product SET F_Location = @newLocation WHERE F_ProductID = @productId');

    console.log('🪵 Logging change...');
    await pool.request()
      .input('LogTime', sql.DateTime, new Date())
      .input('EmployeeID', sql.VarChar, employeeId || null)
      .input('ProductID', sql.VarChar, productId)
      .input('Location', sql.VarChar, newLocation)
      .query('INSERT INTO Log_ChangeLocation (F_LogTime, F_EmployeeID, F_ProductId, F_Location) VALUES (@LogTime, @EmployeeID, @ProductID, @Location)');

    console.log('✅ Change location success:', { productId, newLocation, employeeId });
    res.json({ message: 'เปลี่ยน Location สำเร็จ' });
  } catch (err) {
    console.error('💥 Error changing location:', err);
    res.status(500).json({ error: err.message });
  }
};
