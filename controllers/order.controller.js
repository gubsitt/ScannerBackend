const { sql, poolPromise } = require('../config/dbConfig');

exports.getOrders = async (req, res) => {
  console.log('📥 GET /getOrders called with query:', req.query);

  try {
    const pool = await poolPromise;

    console.log('🔍 Querying View_PickingCheckHead...');
    const result = await pool.request().query(`
      SELECT * FROM View_PickingCheckHead
    `);

    console.log('🔍 Querying item count from View_PickingCheckDetail...');
    const detailResult = await pool.request().query(`
      SELECT F_SaleOrderNo, COUNT(*) AS itemCount
      FROM View_PickingCheckDetail
      GROUP BY F_SaleOrderNo
    `);

    const itemCountMap = {};
    detailResult.recordset.forEach(row => {
      itemCountMap[row.F_SaleOrderNo] = row.itemCount;
    });

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

    let orders = result.recordset.map(row => ({
      ...row,
      color: getColor(row.F_SendDate),
      itemCount: itemCountMap[row.F_SaleOrderNo] || 0
    }));

    if (req.query.color) {
      console.log(`🎨 Filtering orders by color: ${req.query.color}`);
      orders = orders.filter(order => order.color === req.query.color);
    }

    console.log(`✅ Returning ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    console.error('💥 Error in getOrders:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getOrder = async (req, res) => {
  const { saleOrderNo } = req.params;
  console.log(`📥 GET /getOrder/${saleOrderNo}`);

  try {
    const pool = await poolPromise;
    console.log(`🔍 Querying View_PickingCheckHead for saleOrderNo: ${saleOrderNo}`);

    const result = await pool
      .request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .query('SELECT * FROM View_PickingCheckHead WHERE F_SaleOrderNo = @saleOrderNo');

    if (result.recordset.length > 0) {
      console.log('✅ Found order:', result.recordset[0]);
    } else {
      console.warn('⚠️ No order found for:', saleOrderNo);
    }

    res.json(result.recordset[0] || {});
  } catch (err) {
    console.error('💥 Error in getOrder:', err);
    res.status(500).json({ error: err.message });
  }
};
