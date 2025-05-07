const { sql, poolPromise } = require('../config/dbConfig');

exports.searchOrder = async (req, res) => {
  const { keyword } = req.query;
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM Trans_PickingCheckHead WHERE 1=1';

    if (keyword) {
      query += ' AND (F_SaleOrderNo LIKE \'%\' + @keyword + \'%\' OR F_CustomerName LIKE N\'%\' + @keyword + \'%\')';
    }

    const request = pool.request();
    if (keyword) request.input('keyword', sql.NVarChar, keyword);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.searchOrderDetails = async (req, res) => {
    const { keyword, saleOrderNo } = req.query;
    try {
      const pool = await poolPromise;
      let query = 'SELECT * FROM Trans_PickingCheckDetail WHERE 1=1';
  
      if (saleOrderNo) {
        query += ' AND F_SaleOrderNo = @saleOrderNo';
      }
  
      if (keyword) {
        query += ' AND (F_ProductId LIKE \'%\' + @keyword + \'%\' OR F_Desciption LIKE N\'%\' + @keyword + \'%\')';
      }
  
      const request = pool.request();
      if (saleOrderNo) request.input('saleOrderNo', sql.VarChar, saleOrderNo);
      if (keyword) request.input('keyword', sql.NVarChar, keyword);
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

exports.searchScannedSN = async (req, res) => {
  const { keyword } = req.query;
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM Trans_ProductSN WHERE 1=1';

    if (keyword) {
      query += `
        AND (
          F_SaleOrderNo LIKE '%' + @keyword + '%' OR
          F_ProductId LIKE '%' + @keyword + '%' OR
          F_ProductSN LIKE '%' + @keyword + '%'
        )
      `;
    }

    const request = pool.request();
    if (keyword) request.input('keyword', sql.NVarChar, keyword);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
