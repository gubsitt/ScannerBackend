const { sql, poolPromise } = require('../config/dbConfig');

exports.getOrderDetails = async (req, res) => {
  const { saleOrderNo } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('saleOrderNo', sql.VarChar, saleOrderNo)
      // .query(`
      //   SELECT *,
      //     F_PIQty AS ScannedQty,
      //     CASE 
      //       WHEN F_Qty - F_PIQty < 0 THEN 0
      //       ELSE F_Qty - F_PIQty
      //     END AS RemainingQty
      //   FROM Trans_PickingCheckDetail
      //   WHERE F_SaleOrderNo = @saleOrderNo
      // `);
      .query(`
     select Trans_PickingCheckDetail.*, 
      F_Qty - isnull(f_Count, 0) as RemainingQty from Trans_PickingCheckDetail 
        left join (select F_SaleOrderNo, F_ProductID,F_Index, COUNT(*) as 
        f_Count from Trans_ProductSN group by F_SaleOrderNo, F_ProductID,F_Index) 
        as Trans_ProductSN on Trans_ProductSN.F_SaleOrderNo = Trans_PickingCheckDetail.F_SaleOrderNo 
        and Trans_ProductSN.F_ProductID = Trans_PickingCheckDetail.F_ProductID 
        and Trans_ProductSN.F_Index =Trans_PickingCheckDetail.F_Index
        WHERE Trans_PickingCheckDetail.F_SaleOrderNo = @saleOrderNo
      `);


    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
