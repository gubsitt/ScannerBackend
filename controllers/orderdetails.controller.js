const { sql, poolPromise } = require('../config/dbConfig');

exports.getOrderDetails = async (req, res) => {
  const { saleOrderNo } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
         // .query(
      //   SELECT *,
      //     F_PIQty AS ScannedQty,
      //     CASE 
      //       WHEN F_Qty - F_PIQty < 0 THEN 0
      //       ELSE F_Qty - F_PIQty
      //     END AS RemainingQty
      //   FROM Trans_PickingCheckDetail
      //   WHERE F_SaleOrderNo = @saleOrderNo
      // );
      .query(`
        SELECT 
          Trans_PickingCheckDetail.*,
          F_Qty - ISNULL(f_Count, 0) AS RemainingQty
        FROM Trans_PickingCheckDetail
        LEFT JOIN (
          SELECT 
            F_SaleOrderNo, 
            F_ProductID, 
            F_Index, 
            COUNT(*) AS f_Count
          FROM Trans_ProductSN
          GROUP BY F_SaleOrderNo, F_ProductID, F_Index
        ) AS Trans_ProductSN 
          ON Trans_ProductSN.F_SaleOrderNo = Trans_PickingCheckDetail.F_SaleOrderNo 
          AND Trans_ProductSN.F_ProductID = Trans_PickingCheckDetail.F_ProductID 
          AND Trans_ProductSN.F_Index = Trans_PickingCheckDetail.F_Index
        WHERE Trans_PickingCheckDetail.F_SaleOrderNo = @saleOrderNo
      `);

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
    res.status(500).json({ error: err.message });
  }
};
