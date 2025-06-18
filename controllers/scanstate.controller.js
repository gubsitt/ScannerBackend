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

    function getStatusColor(status) {
      const statusColorMap = {
        '1': 'red',
        '2': 'red',
        '3': 'gold',
        'C': 'gold',
        'CD': 'gold',
        'W': 'darkorange',
        'WC': 'darkorange',
        '4': 'blue',
        '5': 'lime',
        '6': 'green',
        '7': 'black',
        'WP': 'black',
        'WB': 'black'
      };
      return status && statusColorMap[status] ? statusColorMap[status] : '';
    }

    function getDateColor(sendDate) {
      if (!sendDate) return '';
      const today = new Date();
      today.setHours(0,0,0,0);
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


    //กำหนดผลลัพธ์การตรวจสอบตามประเภทการพิมพ์และสี
    const orders = result.recordset.map(row => {
  const productId = row.F_ProductId || row.F_ProductID;

  //เอาไว้ตรวจสอบครับกัส
  let checkPlate = row.F_CheckPlate;
  let checkBlock = row.F_CheckBlock;
  let checkColour = row.F_CheckColour;

  if (row.F_Product_PrintTypeId === 'P1') {
    checkPlate = 'Pass';
    checkColour = 'Pass';
  } else if (row.F_Product_PrintTypeId === 'P6') {
    checkPlate = 'Pass';
    checkBlock = 'Pass';
    checkColour = 'Pass';
  } else if (row.F_Product_PrintTypeId === 'P4' || row.F_Product_PrintTypeId === 'P7') {
    checkBlock = 'Pass';
  } else {
    if (row.F_ColourOrBank === 'BLANK') {
      checkPlate = 'Pass';
      checkColour = 'Pass';
    }
  }

  return {
    ...row,
    statusColor: getStatusColor(row.F_Status),
    Color: getDateColor(row.F_SendDate),
    imagePath: productId
      ? `http://172.16.10.8/${productId}/${productId}-WDFile.jpg`
      : null,

    //แนบค่าใหม่ที่ผ่านการปรับ logic
    F_CheckPlate: checkPlate,
    F_CheckBlock: checkBlock,
    F_CheckColour: checkColour,
  };
});


    res.json(orders);
  } catch (err) {
    console.error('💥 error:', err);
    res.status(500).json({ error: err.message });
  }
};