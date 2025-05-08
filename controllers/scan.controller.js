const { sql, poolPromise } = require('../config/dbConfig');

exports.scanSerialNumber = async (req, res) => {
  const { saleOrderNo, productId, index, productSN } = req.body;

  if (!saleOrderNo || !productId || !index || !productSN) {
    return res.status(400).json({ error: 'Missing fields in request' });
  }

  try {
    const pool = await poolPromise;

    const qtyResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT F_Qty FROM Trans_PickingCheckDetail
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const requiredQty = qtyResult.recordset[0]?.F_Qty;

    const countResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT COUNT(*) AS scannedQty FROM Trans_ProductSN
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const scannedQty = countResult.recordset[0]?.scannedQty;

    if (scannedQty >= requiredQty) {
      return res.status(400).json({ error: 'สแกนครบจำนวนแล้ว ไม่สามารถสแกนเพิ่มได้' });
    }

    const existing = await pool.request()
      .input('productSN', sql.VarChar, productSN)
      .query('SELECT * FROM Trans_ProductSN WHERE F_ProductSN = @productSN');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: 'This SN is already scanned' });
    }

    await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .input('productSN', sql.VarChar, productSN)
      .query(`
        INSERT INTO Trans_ProductSN (F_SaleOrderNo, F_ProductId, F_Index, F_ProductSN)
        VALUES (@saleOrderNo, @productId, @index, @productSN)
      `);

    const countResultAfter = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT COUNT(*) AS scannedQty FROM Trans_ProductSN
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const scannedQtyAfter = countResultAfter.recordset[0].scannedQty;

    await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .input('qty', sql.Int, scannedQtyAfter)
      .query(`
        UPDATE Trans_PickingCheckDetail
        SET F_PIQty = @qty
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);

    if (scannedQtyAfter >= requiredQty) {
      await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .input('productId', sql.VarChar, productId)
        .input('index', sql.Int, index)
        .query(`
          UPDATE Trans_PickingCheckDetail
          SET F_CheckSNStatus = 1
          WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
        `);

      const allDoneCheck = await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query(`
          SELECT COUNT(*) AS notDone
          FROM Trans_PickingCheckDetail
          WHERE F_SaleOrderNo = @saleOrderNo AND F_CheckSNStatus = 0
        `);

      const notDone = allDoneCheck.recordset[0].notDone;

      if (notDone === 0) {
        await pool.request()
          .input('saleOrderNo', sql.VarChar, saleOrderNo)
          .query(`
            UPDATE Trans_PickingCheckHead
            SET F_CheckSNStatus = 1
            WHERE F_SaleOrderNo = @saleOrderNo
          `);
      }
    }

    res.json({
      success: true,
      message: 'Scan saved successfully',
      scannedQty: scannedQtyAfter,
      requiredQty,
      isComplete: scannedQtyAfter >= requiredQty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllScannedSNs = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT sn.F_SaleOrderNo, sn.F_ProductId, sn.F_Index, sn.F_ProductSN
      FROM Trans_ProductSN sn
      INNER JOIN Trans_PickingCheckHead h ON sn.F_SaleOrderNo = h.F_SaleOrderNo
      WHERE CAST(h.F_SendDate AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY sn.F_SaleOrderNo DESC, sn.F_Index
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




  
  exports.getScannedByOrder = async (req, res) => {
    const { saleOrderNo } = req.params;
  
    try {
      const pool = await poolPromise;
  
      const scanGroups = await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query(`
          SELECT F_ProductId, F_Index, COUNT(*) AS ScannedQty
          FROM Trans_ProductSN
          WHERE F_SaleOrderNo = @saleOrderNo
          GROUP BY F_ProductId, F_Index
        `);
  
      const result = [];
  
      for (const row of scanGroups.recordset) {
        const { F_ProductId, F_Index, ScannedQty } = row;
  
        const snListResult = await pool.request() 
          .input('saleOrderNo', sql.VarChar, saleOrderNo)
          .input('productId', sql.VarChar, F_ProductId)
          .input('index', sql.Int, F_Index)
          .query(`
            SELECT F_ProductSN FROM Trans_ProductSN
            WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
          `);
        const SN_List = snListResult.recordset.map(r => r.F_ProductSN);
  
        
        const detailResult = await pool.request()
          .input('saleOrderNo', sql.VarChar, saleOrderNo)
          .input('productId', sql.VarChar, F_ProductId)
          .input('index', sql.Int, F_Index)
          .query(`
            SELECT F_Qty, F_Desciption
            FROM Trans_PickingCheckDetail
            WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
          `);
  
        const { F_Qty, F_Desciption } = detailResult.recordset[0];
  
        result.push({
          F_ProductId,
          F_Index,
          F_Description: F_Desciption,
          F_Qty,
          ScannedQty,
          isComplete: ScannedQty >= F_Qty,
          SN_List
        });
      }
  
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };  



exports.deleteScannedSN = async (req, res) => {
  const { saleOrderNo, productId, index, productSN } = req.body;

  if (!saleOrderNo || !productId || !index || !productSN) {
    return res.status(400).json({ error: 'Missing fields in request' });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .input('productSN', sql.VarChar, productSN)
      .query(`
        DELETE FROM Trans_ProductSN
        WHERE F_SaleOrderNo = @saleOrderNo
          AND F_ProductId = @productId
          AND F_Index = @index
          AND F_ProductSN = @productSN
      `);

    const countResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT COUNT(*) AS scannedQty FROM Trans_ProductSN
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const scannedQty = countResult.recordset[0].scannedQty;

    await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .input('qty', sql.Int, scannedQty)
      .query(`
        UPDATE Trans_PickingCheckDetail
        SET F_PIQty = @qty
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);

    const qtyResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT F_Qty FROM Trans_PickingCheckDetail
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const requiredQty = qtyResult.recordset[0]?.F_Qty;

    if (scannedQty < requiredQty) {
      await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .input('productId', sql.VarChar, productId)
        .input('index', sql.Int, index)
        .query(`
          UPDATE Trans_PickingCheckDetail
          SET F_CheckSNStatus = 0
          WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
        `);
    }

    const allDoneCheck = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .query(`
        SELECT COUNT(*) AS notDone
        FROM Trans_PickingCheckDetail
        WHERE F_SaleOrderNo = @saleOrderNo AND F_CheckSNStatus = 0
      `);

    const notDone = allDoneCheck.recordset[0].notDone;

    if (notDone > 0) {
      await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query(`
          UPDATE Trans_PickingCheckHead
          SET F_CheckSNStatus = 0
          WHERE F_SaleOrderNo = @saleOrderNo
        `);
    }

    res.json({
      success: true,
      message: 'ลบ SN สำเร็จ',
      scannedQty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

