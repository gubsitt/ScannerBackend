const { sql, poolPromise } = require('../config/dbConfig');

exports.getOrderAllDetails = async (req, res) => {
  const { saleOrderNo } = req.params;

  console.log(`📥 GET /getOrderDetails/${saleOrderNo}`);

  try {
    const pool = await poolPromise;

    console.log(`🔍 Querying details for saleOrderNo: ${saleOrderNo}`);

    const result = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      .query(`
            SELECT 
          View_PickingCheckDetail_All.*,
          F_Qty - ISNULL(f_Count, 0) AS RemainingQty
        FROM View_PickingCheckDetail_All
        LEFT JOIN (
          SELECT 
            F_SaleOrderNo, 
            F_ProductID, 
            F_Index, 
            COUNT(*) AS f_Count
          FROM Trans_ProductSN
          GROUP BY F_SaleOrderNo, F_ProductID, F_Index
        ) AS Trans_ProductSN 
          ON Trans_ProductSN.F_SaleOrderNo = View_PickingCheckDetail_All.F_SaleOrderNo 
          AND Trans_ProductSN.F_ProductID = View_PickingCheckDetail_All.F_ProductID 
          AND Trans_ProductSN.F_Index = View_PickingCheckDetail_All.F_Index
        WHERE View_PickingCheckDetail_All.F_SaleOrderNo = @saleOrderNo
      `);

    console.log(`✅ Found ${result.recordset.length} items for saleOrderNo: ${saleOrderNo}`);

    const items = result.recordset.map(row => {
      const productId = row.F_ProductId || row.F_ProductID;

      return {
        ...row,
        imagePath: productId
          ? `http://172.16.10.8/${productId}/${productId}-WDFile.jpg`
          : null
      };
    });

    res.json(items);
  } catch (err) {
    console.error(`💥 Error in getOrderDetails for saleOrderNo: ${saleOrderNo}`, err);
    res.status(500).json({ error: err.message });
  }
};
