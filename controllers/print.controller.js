const { sql, poolPromise } = require('../config/dbConfig');

exports.printAndLog = async (req, res) => {
  const { processOrderId, employeeName, PrinterId,PrintReport } = req.body;
  console.log('📥 รับค่า processOrderId:', processOrderId);

  if (!processOrderId || !employeeName || !PrinterId || !PrintReport) {
    console.warn('⚠️ ไม่ได้ระบุ processOrderId ,employeeName ,PrinterId และ PrintReport');
    return res.status(400).json({ error: 'กรุณาระบุ processOrderId ,employeeName ,PrinterId และ PrintReport' });
  }

  try {
    const pool = await poolPromise;

    console.log('🔍 ตรวจสอบรายการ print ที่ยังไม่สำเร็จ...');
    const printParameter = `${processOrderId},${employeeName}`;
    const checkResult = await pool.request()
      .input('printParameter', sql.NVarChar, printParameter)
      .query(`
        SELECT TOP 1 *
        FROM Trans_PrintTask
        WHERE f_PrintParameter = @printParameter AND f_PrintTaskStatus = 0
      `);

    console.log('📦 ผลลัพธ์การตรวจสอบ:', checkResult.recordset);

    if (checkResult.recordset.length > 0) {
      console.warn('❌ พบรายการ print ที่มีสถานะเป็น 0 สำหรับ processOrderId นี้แล้ว');
      return res.status(409).json({ error: 'มีรายการ print ที่มีสถานะเป็น 0 สำหรับ processOrderId นี้แล้ว' });
    }

    const printTaskData = {
      f_PrintTaskDate: new Date(),
      f_PrintParameter: `${processOrderId},${employeeName}`,
      f_PrintReport: PrintReport,
      f_PrintDestination: PrinterId,
      f_PrintTaskStatus: 0
    };

    console.log('📝 ข้อมูลที่จะบันทึก:', printTaskData);

    await pool.request()
      .input('f_PrintTaskDate', sql.DateTime, printTaskData.f_PrintTaskDate)
      .input('f_PrintParameter', sql.NVarChar, printTaskData.f_PrintParameter)
      .input('f_PrintReport', sql.NVarChar, printTaskData.f_PrintReport)
      .input('f_PrintDestination', sql.NVarChar, printTaskData.f_PrintDestination)
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

exports.getPrinters = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM Sys_PrinterList
    `);
        console.log('📦 ผลลัพธ์ Printer:', result.recordset);
    res.json({ printers: result.recordset });
  } catch (err) {
    console.error('💥 error:', err);
    res.status(500).json({ error: err.message });
  }
};
