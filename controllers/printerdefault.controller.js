const { sql, poolPromise } = require('../config/dbConfig');

exports.getDefaultPrinter = async (req, res) => {
  const { reportName } = req.params;
  console.log(`📥 [PrinterDefault] GET /printerdefault/${reportName}`);

  try {
    const pool = await poolPromise;
    console.log(`[PrinterDefault] 🔍 Querying default printer for reportName: ${reportName}`);
    const result = await pool.request()
      .input('reportName', sql.VarChar, reportName)
      .query(`
        SELECT f_PrinterDefault
        FROM Sys_PrinterDefault
        WHERE f_ReportName = @reportName
      `);

    console.log(`[PrinterDefault] 📦 Query result:`, result.recordset);

    if (result.recordset.length > 0) {
      console.log(`[PrinterDefault] ✅ Found default printer: ${result.recordset[0].f_PrinterDefault}`);
      res.json({ printerDefault: result.recordset[0].f_PrinterDefault });
    } else {
      console.warn(`[PrinterDefault] ⚠️ ไม่พบค่า default printer สำหรับ report: ${reportName}`);
      res.status(404).json({ error: 'ไม่พบค่า default printer สำหรับ report นี้' });
    }
  } catch (err) {
    console.error('💥 [PrinterDefault] Error:', err);
    res.status(500).json({ error: err.message });
  }
};