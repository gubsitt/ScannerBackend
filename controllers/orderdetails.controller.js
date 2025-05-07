const { sql, poolPromise } = require('../config/dbConfig');

exports.getOrderDetails = async (req, res) => {
    const { saleOrderNo } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query('SELECT * FROM Trans_PickingCheckDetail WHERE F_SaleOrderNo = @saleOrderNo');
  
        res.json(result.recordset);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }