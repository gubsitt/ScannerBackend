const { sql, poolPromise } = require('../config/dbConfig');

exports.getWprData = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT [F_WdProcessReqNo]
      ,[F_DocDate]
      ,[F_SaleOrderNo]
      ,[F_SalemanId]
      ,[F_SalemanName]
      ,[F_CustomerId]
      ,[F_Prefix]
      ,[F_CompanyName]
      ,[F_WdProcessReqStatus]
      ,[F_Print]
      ,[F_RunNo]
      ,[F_ProductIdSo]
      ,[F_ProductNameSo]
      ,[F_QtySo]
      ,[F_SendDate]
  FROM [WMS_NewWarehouse].[dbo].[View_WithdrawalProcessReqHead]
      WHERE F_WdProcessReqStatus = '1'
    `);

          
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
      color: getColor(row.F_SendDate)
  
    }));


        res.json(orders);
    } catch (err) {
        console.error('Error fetching WPR data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getWprDetail = async (req, res) => {
  const reqNo = req.params.reqNo;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('reqNo', sql.VarChar, reqNo)
      .query(`
        SELECT [F_WdProcessReqNo]
              ,[F_Index]
              ,[F_ProductId]
              ,[F_Desciption]
              ,[F_Qty]
              ,[F_UnitName]
              ,[F_Remark]
              ,[F_Location]
        FROM [WMS_NewWarehouse].[dbo].[View_WithdrawalProcessReqDetail]
        WHERE F_WdProcessReqNo = @reqNo
      `);

    const itemsWithImage = result.recordset.map(row => {
      const productId = row.F_ProductId;
      return {
        ...row,
        imagePath: productId
          ? `http://172.16.10.8/${productId}/${productId}-WDFile.jpg`
          : null
      };
    });

    res.json(itemsWithImage);
  } catch (err) {
    console.error('Error fetching WPR detail:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

