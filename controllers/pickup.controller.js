const { sql, poolPromise } = require('../config/dbConfig');

exports.updatePickupStatus = async (req, res) => {
  const { saleOrderNo, index } = req.body;
  console.log('📥 [updatePickupStatus] รับค่า:', { saleOrderNo, index });

  try {
    const pool = await poolPromise;

    console.log('🔄 [updatePickupStatus] อัปเดต F_Pickup = 1 ที่ Detail...');
    await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('index', sql.Int, index)
      .query(`
        UPDATE Trans_PickingCheckDetail
        SET F_Pickup = 1
        WHERE F_SaleOrderNo = @saleOrderNo AND F_Index = @index
      `);

    console.log('🔍 [updatePickupStatus] ตรวจสอบจำนวนที่เหลือ...');
    const result = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .query(`
        SELECT COUNT(*) AS Remaining
        FROM Trans_PickingCheckDetail
        WHERE F_SaleOrderNo = @saleOrderNo AND ISNULL(F_Pickup, 0) = 0
      `);

    const remaining = result.recordset[0].Remaining;
    const isCompleted = remaining === 0;
    console.log(`📦 [updatePickupStatus] Remaining: ${remaining}, isCompleted: ${isCompleted}`);

    if (isCompleted) {
      console.log('✅ [updatePickupStatus] อัปเดต Head ให้ F_Pickup = 1');
      await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query(`
          UPDATE Trans_PickingCheckHead
          SET F_Pickup = 1
          WHERE F_SaleOrderNo = @saleOrderNo
        `);
    }

    res.status(200).json({
      message: 'อัปเดตสถานะ F_Pickup สำเร็จ',
      headUpdated: isCompleted,
      remaining: remaining,
      isCompleted: isCompleted
    });
    console.log('✅ [updatePickupStatus] ส่งผลลัพธ์กลับ:', {
      headUpdated: isCompleted,
      remaining: remaining,
      isCompleted: isCompleted
    });
  } catch (err) {
    console.error('💥 [updatePickupStatus] Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
};


exports.cancelPickupStatus = async (req, res) => {
  const { saleOrderNo, index } = req.body;
  console.log('📥 [cancelPickupStatus] รับค่า:', { saleOrderNo, index });

  try {
    const pool = await poolPromise;

    console.log('🔄 [cancelPickupStatus] อัปเดต F_Pickup = 0 ที่ Detail...');
    await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .input('index', sql.Int, index)
      .query(`
        UPDATE Trans_PickingCheckDetail
        SET F_Pickup = 0
        WHERE F_SaleOrderNo = @saleOrderNo AND F_Index = @index
      `);

    console.log('🔍 [cancelPickupStatus] ตรวจสอบจำนวนที่เหลือ...');
    const result = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .query(`
        SELECT COUNT(*) AS Remaining
        FROM Trans_PickingCheckDetail
        WHERE F_SaleOrderNo = @saleOrderNo AND ISNULL(F_Pickup, 0) = 0
      `);

    const remaining = result.recordset[0].Remaining;
    const isCompleted = remaining === 0;
    console.log(`📦 [cancelPickupStatus] Remaining: ${remaining}, isCompleted: ${isCompleted}`);

    if (!isCompleted) {
      console.log('🔄 [cancelPickupStatus] อัปเดต Head ให้ F_Pickup = 0');
      await pool.request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query(`
          UPDATE Trans_PickingCheckHead
          SET F_Pickup = 0
          WHERE F_SaleOrderNo = @saleOrderNo
        `);
    }

    res.status(200).json({
      message: 'ยกเลิกสถานะ F_Pickup สำเร็จ',
      headUpdated: !isCompleted,
      remaining: remaining,
      isCompleted: isCompleted
    });
    console.log('✅ [cancelPickupStatus] ส่งผลลัพธ์กลับ:', {
      headUpdated: !isCompleted,
      remaining: remaining,
      isCompleted: isCompleted
    });
  } catch (err) {
    console.error('💥 [cancelPickupStatus] Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยกเลิกสถานะ' });
  }
};