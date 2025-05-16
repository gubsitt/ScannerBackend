const { sql, poolPromise } = require('../config/dbConfig');


exports.getOrders = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM View_PickingCheckHead
    `);

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
      orders = orders.filter(order => order.color === req.query.color);
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


  exports.getOrder = async (req, res) => {
    const { saleOrderNo } = req.params;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input('saleOrderNo', sql.VarChar, saleOrderNo)
        .query('SELECT * FROM View_PickingCheckHead WHERE F_SaleOrderNo = @saleOrderNo');
  
      res.json(result.recordset[0] || {});
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };