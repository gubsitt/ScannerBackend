const { sql, poolPromise } = require('../config/dbConfig');

exports.scanSerialNumber = async (req, res) => {
  const { saleOrderNo, productId, index, productSN } = req.body;
  console.log('📥 POST /scanSerialNumber:', req.body);

  if (!saleOrderNo || !productId || !index || !productSN) {
    console.warn('⚠️ Missing fields:', req.body);
    return res.status(400).json({ error: 'Missing fields in request' });
  }

  try {
    const pool = await poolPromise;

    const qtyResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT F_Qty FROM View_PickingCheckDetail
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
const requiredQty = (qtyResult.recordset || [])[0] && qtyResult.recordset[0].F_Qty;
    console.log('🔢 RequiredQty:', requiredQty);

    const countResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT COUNT(*) AS scannedQty FROM Trans_ProductSN
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const scannedQty = (countResult.recordset || [])[0] && countResult.recordset[0].scannedQty;

    console.log('🔄 AlreadyScannedQty:', scannedQty);

    if (scannedQty >= requiredQty) {
      console.warn('⚠️ Scanned more than required');
      return res.status(400).json({ error: 'สแกนครบจำนวนแล้ว ไม่สามารถสแกนเพิ่มได้' });
    }

    const existing = await pool.request()
      .input('productSN', sql.VarChar, productSN)
      .query('SELECT * FROM Trans_ProductSN WHERE F_ProductSN = @productSN');

    if (existing.recordset.length > 0) {
      console.warn('⚠️ Duplicate SN:', productSN);
      return res.status(400).json({ error: 'This SN is already scanned' });
    }

    await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .input('productSN', sql.VarChar, productSN)
      .query(`
        INSERT INTO Trans_ProductSN (F_SaleOrderNo, F_ProductId, F_Index, F_ProductSN, F_PostInvoiceNo)
        VALUES (@saleOrderNo, @productId, @index, @productSN, 'Wait')
      `);
    console.log('✅ SN inserted:', productSN);

    const countResultAfter = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT COUNT(*) AS scannedQty FROM Trans_ProductSN
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const scannedQtyAfter = countResultAfter.recordset[0].scannedQty;

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
          FROM View_PickingCheckDetail
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
        console.log('📦 All items in order completed');
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
    console.error('💥 Error in scanSerialNumber:', err);
    res.status(500).json({ error: err.message });
  }
};



exports.getAllScannedSNs = async (req, res) => {
  console.log('📥 GET /getAllScannedSNs');

  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT sn.F_SaleOrderNo, sn.F_ProductId, sn.F_Index, sn.F_ProductSN
      FROM Trans_ProductSN sn
      INNER JOIN View_PickingCheckHead h ON sn.F_SaleOrderNo = h.F_SaleOrderNo
      ORDER BY sn.F_SaleOrderNo DESC, sn.F_Index
    `);

    console.log(`✅ Returned ${result.recordset.length} scanned SNs`);
    res.json(result.recordset);
  } catch (err) {
    console.error('💥 Error in getAllScannedSNs:', err);
    res.status(500).json({ error: err.message });
  }
};




  
exports.getScannedByOrder = async (req, res) => {
  const { saleOrderNo } = req.params;
  console.log('📥 GET /getScannedByOrder:', saleOrderNo);

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

      const detailResult = await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .input('productId', sql.VarChar, F_ProductId)
        .input('index', sql.Int, F_Index)
        .query(`
          SELECT F_Qty, F_Desciption
          FROM View_PickingCheckDetail
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
        SN_List: snListResult.recordset.map(r => r.F_ProductSN)
      });
    }

    console.log(`✅ Retrieved scanned SNs for order: ${saleOrderNo}`);
    res.json(result);
  } catch (err) {
    console.error('💥 Error in getScannedByOrder:', err);
    res.status(500).json({ error: err.message });
  }
};



exports.deleteScannedSN = async (req, res) => {
  const { saleOrderNo, productId, index, productSN } = req.body;
  console.log('📥 DELETE /deleteScannedSN:', req.body);

  if (!saleOrderNo || !productId || !index || !productSN) {
    console.warn('⚠️ Missing fields:', req.body);
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

    console.log('🗑️ SN deleted:', productSN);

    const countResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT COUNT(*) AS scannedQty FROM Trans_ProductSN
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
    const scannedQty = countResult.recordset[0].scannedQty;

    const qtyResult = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('productId', sql.VarChar, productId)
      .input('index', sql.Int, index)
      .query(`
        SELECT F_Qty FROM View_PickingCheckDetail
        WHERE F_SaleOrderNo = @saleOrderNo AND F_ProductId = @productId AND F_Index = @index
      `);
const requiredQty = (qtyResult.recordset || [])[0] && qtyResult.recordset[0].F_Qty;

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
        FROM View_PickingCheckDetail
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
    console.error('💥 Error in deleteScannedSN:', err);
    res.status(500).json({ error: err.message });
  }
};

