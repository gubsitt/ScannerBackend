const { sql, poolPromise } = require('../config/dbConfig');

exports.searchOrder = async (req, res) => {
  const { keyword } = req.query;
  console.log('📥 GET /searchOrder with keyword:', keyword);

  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM View_PickingCheckHead WHERE 1=1';

    if (keyword) {
      query += ' AND (F_SaleOrderNo LIKE \'%\' + @keyword + \'%\' OR F_CustomerName LIKE N\'%\' + @keyword + \'%\')';
    }

    const request = pool.request();
    if (keyword) request.input('keyword', sql.NVarChar, keyword);

    const result = await request.query(query);
    console.log(`✅ Found ${result.recordset.length} orders`);
    res.json(result.recordset);
  } catch (err) {
    console.error('💥 Error in searchOrder:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.searchOrderDetails = async (req, res) => {
  const { keyword, saleOrderNo } = req.query;
  console.log('📥 GET /searchOrderDetails with:', { saleOrderNo, keyword });

  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM View_PickingCheckDetail WHERE 1=1';

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
    console.log(`✅ Found ${result.recordset.length} order details`);
    res.json(result.recordset);
  } catch (err) {
    console.error('💥 Error in searchOrderDetails:', err);
    res.status(500).json({ error: err.message });
  }
};
  

exports.searchScannedSN = async (req, res) => {
  const { keyword } = req.query;
  console.log('📥 GET /searchScannedSN with keyword:', keyword);

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
    console.log(`✅ Found ${result.recordset.length} scanned SNs`);
    res.json(result.recordset);
  } catch (err) {
    console.error('💥 Error in searchScannedSN:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.searchStockBalance = async (req, res) => {
  const { keyword } = req.query;
  console.log('📥 GET /searchStockBalance with keyword:', keyword);

  try {
    const pool = await poolPromise;

    let query = `
      SELECT * 
      FROM View_StockBalance
      WHERE 1=1
    `;

    if (keyword) {
      query += `
        AND (
          F_ProductId LIKE '%' + @keyword + '%' OR 
          F_ProductName LIKE N'%' + @keyword + '%'
        )
      `;
    }

    const request = pool.request();
    if (keyword) request.input('keyword', sql.NVarChar, keyword);

    const result = await request.query(query);

    const items = result.recordset.map(row => {
      const productId = row.F_ProductId || row.F_ProductID;
      return {
        ...row,
        imagePath: productId
          ? `http://172.16.10.8/${productId}/${productId}-WDFile.jpg`
          : null
      };
    });

    console.log(`✅ Found ${items.length} stock items`);
    res.json(items);
  } catch (err) {
    console.error('💥 Error in searchStockBalance:', err);
    res.status(500).json({ error: err.message });
  }
};



