const { sql, poolPromise } = require('../config/dbConfig');


exports.getOrders = async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM Trans_PickingCheckHead');
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };


  exports.getOrder = async (req, res) => {
    const { saleOrderNo } = req.params;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query('SELECT * FROM Trans_PickingCheckHead WHERE F_SaleOrderNo = @saleOrderNo');
  
      res.json(result.recordset[0] || {});
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };