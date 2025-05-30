const { sql, poolPromise } = require('../config/dbConfig');

exports.getProcessOrderDetail = async (req, res) => {
  const { processOrderId } = req.query;
  console.log('📥 รับค่า processOrderId:', processOrderId);

  if (!processOrderId) {
    console.warn('⚠️ ไม่ได้ระบุ processOrderId');
    return res.status(400).json({ error: 'กรุณาระบุ processOrderId' });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('processOrderId', sql.VarChar, processOrderId)
      .query(`
        SELECT *
        FROM View_ProcessOrderMain
        WHERE F_ProcessOrderId = @processOrderId
      `);

    console.log('📦 ผลลัพธ์ที่ query ได้:', result.recordset);

    if (result.recordset.length === 0) {
      console.warn('❌ ไม่พบข้อมูล');
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    function getColor(sendDate) {
      if (!sendDate) return '';
      const date = new Date(sendDate);
      date.setHours(0,0,0,0);
      const diff = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) return 'red';
      if (diff === 0) return 'yellow';
      if (diff === 1) return 'pink';
      if (diff === 2) return 'blue';
      if (diff === 3) return 'purple';
      if (diff === 4) return 'lightsky';
      if (diff === 5) return 'brown';
      if (diff === 6) return 'lightgreen';
      if (diff > 6) return 'green';
      return '';
    }

    const orders = result.recordset.map(row => {
      const productId = row.F_ProductId || row.F_ProductID;
      return {
        ...row,
        color: getColor(row.F_SendDate),
        imagePath: productId
          ? `http://172.16.10.8/${productId}/${productId}-WDFile.jpg`
          : null
      };
    });

    res.json(orders);
  } catch (err) {
    console.error('💥 error:', err);
    res.status(500).json({ error: err.message });
  }
};