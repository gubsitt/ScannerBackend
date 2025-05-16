const { sql, poolPromise } = require('../config/dbConfig');

exports.changeLocation = async (req, res) => {
  const { productId, newLocation, employeeId } = req.body;

  if (!productId || !newLocation) {
    return res.status(400).json({ error: 'กรุณาระบุ ProductID และ Location ใหม่' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('productId', sql.VarChar, productId)
      .query('SELECT COUNT(*) AS count FROM Sys_Product WHERE F_ProductID = @productId');

    const productExists = result.recordset[0].count > 0;
    if (!productExists) {
      return res.status(404).json({ error: 'ไม่พบสินค้า ProductID ที่ระบุ' });
    }

    await pool.request()
      .input('productId', sql.VarChar, productId)
      .input('newLocation', sql.VarChar, newLocation)
      .query('UPDATE Sys_Product SET F_Location = @newLocation WHERE F_ProductID = @productId');

    await pool.request()
      .input('LogTime', sql.DateTime, new Date())
      .input('EmployeeID', sql.VarChar, employeeId || null)
      .input('ProductID', sql.VarChar, productId)
      .input('Location', sql.VarChar, newLocation)
      .query('INSERT INTO Log_ChangeLocation (F_LogTime, F_EmployeeID, F_ProductId, F_Location) VALUES (@LogTime, @EmployeeID, @ProductID, @Location)');

    res.json({ message: 'เปลี่ยน Location สำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
