const { sql, poolPromise } = require('../config/dbConfig');

exports.printAndLog = async (req, res) => {
  const { processOrderId } = req.body;
  console.log('📥 รับค่า processOrderId:', processOrderId);

  if (!processOrderId) {
    console.warn('⚠️ ไม่ได้ระบุ processOrderId');
    return res.status(400).json({ error: 'กรุณาระบุ processOrderId' });
  }

  try {
    const pool = await poolPromise;

    console.log('🔍 ตรวจสอบรายการ print ที่ยังไม่สำเร็จ...');
    const checkResult = await pool.request()
      .input('processOrderId', sql.VarChar, processOrderId)
      .query(`
        SELECT TOP 1 *
        FROM Trans_PrintTask
        WHERE f_PrintParameter = @processOrderId AND f_PrintTaskStatus = 0
      `);

    console.log('📦 ผลลัพธ์การตรวจสอบ:', checkResult.recordset);

    if (checkResult.recordset.length > 0) {
      console.warn('❌ พบรายการ print ที่มีสถานะเป็น 0 สำหรับ processOrderId นี้แล้ว');
      return res.status(409).json({ error: 'มีรายการ print ที่มีสถานะเป็น 0 สำหรับ processOrderId นี้แล้ว' });
    }

    const printTaskData = {
      f_PrintTaskDate: new Date(),
      f_PrintParameter: processOrderId,
      f_PrintReport: 'Production_Replace',
      f_PrintDestination: 'RDSMK',
      f_PrintTaskStatus: 0
    };

    console.log('📝 ข้อมูลที่จะบันทึก:', printTaskData);

    await pool.request()
      .input('f_PrintTaskDate', sql.DateTime, printTaskData.f_PrintTaskDate)
      .input('f_PrintParameter', sql.VarChar, printTaskData.f_PrintParameter)
      .input('f_PrintReport', sql.VarChar, printTaskData.f_PrintReport)
      .input('f_PrintDestination', sql.VarChar, printTaskData.f_PrintDestination)
      .input('f_PrintTaskStatus', sql.Int, printTaskData.f_PrintTaskStatus)
      .query(`
        INSERT INTO Trans_PrintTask (f_PrintTaskDate, f_PrintReport, f_PrintParameter, f_PrintDestination, f_PrintTaskStatus)
        VALUES (@f_PrintTaskDate, @f_PrintReport, @f_PrintParameter, @f_PrintDestination, @f_PrintTaskStatus)
      `);

    console.log('✅ บันทึก log print สำเร็จ:', printTaskData);

    res.json({ message: 'บันทึก log print สำเร็จ', data: printTaskData });
  } catch (err) {
    console.error('💥 error:', err);
    res.status(500).json({ error: err.message });
  }
};