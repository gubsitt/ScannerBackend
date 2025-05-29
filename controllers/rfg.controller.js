const { sql, poolPromise } = require('../config/dbConfig');
const moment = require('moment');

exports.getAllRFG = async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM View_WaitReceiveRFG');
  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      function getColor(sendDate) {
        if (!sendDate) return '';
        const date = new Date(sendDate);
        date.setHours(0, 0, 0, 0);
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
  
      const recordsWithColor = result.recordset.map(row => ({
        ...row,
        color: getColor(row.F_SendDate),
      }));
  
      if (req.query.color) {
        const filtered = recordsWithColor.filter(row => row.color === req.query.color);
        res.json(filtered);
      } else {
        res.json(recordsWithColor);
      }
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

exports.updateLocation = async (req, res) => {
    const { processOrderId, newLocation } = req.body;
    if (!processOrderId || !newLocation) {
      return res.status(400).json({ error: 'กรุณาระบุ processOrderId และสถานที่ใหม่' });
    }
    try {
      const pool = await poolPromise;

      const locationResult = await pool.request()
        .input('locationId', sql.VarChar, newLocation)
        .query("SELECT 1 FROM Sys_Location WHERE F_LocationId = @locationId");

      if (locationResult.recordset.length === 0) {
        return res.status(404).json({ error: 'ไม่พบสถานที่นี้ในระบบ' });
      }

      await pool.request()
        .input('processOrderId', sql.VarChar, processOrderId)
        .input('newLocation', sql.VarChar, newLocation)
        .query("UPDATE View_WaitReceiveRFG SET F_Location = @newLocation WHERE F_ProcessOrderId = @processOrderId");
      res.json({ message: 'อัปเดตสถานที่สำเร็จ' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

exports.confirmStockChecked = async (req, res) => {
  const { processOrderId } = req.body;
  if (!processOrderId) {
    return res.status(400).json({ error: 'กรุณาระบุ processOrderId' });
  }

  try {
    const pool = await poolPromise;
    const now = moment();
    const year = now.format('YYYY');
    const month = now.format('MM');
    const yyyymm = year + month;
    const today = now.format('YYYY-MM-DD');
    const time = '08:58:39'; 

    const viewResult = await pool.request()
      .input('processOrderId', sql.VarChar, processOrderId)
      .query(`
        SELECT TOP 1 *
        FROM View_WaitReceiveRFG
        WHERE F_ProcessOrderId = @processOrderId
      `);

    if (viewResult.recordset.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใน View_WaitReceiveRFG' });
    }

    const view = viewResult.recordset[0];

    const prefix = `RFG${yyyymm}`;
    const lastFGNoResult = await pool.request()
      .input('prefix', sql.VarChar, prefix)
      .query(`
        SELECT TOP 1 F_ReceiveFGNo
        FROM Trans_ReceiveFGHead
        WHERE F_ReceiveFGNo LIKE @prefix + '%'
        ORDER BY F_ReceiveFGNo DESC
      `);

    let runNumber = '0001';
    if (lastFGNoResult.recordset.length > 0) {
      const lastNo = lastFGNoResult.recordset[0].F_ReceiveFGNo;
      const lastRun = parseInt(lastNo.slice(-4), 10);
      runNumber = String(lastRun + 1).padStart(4, '0');
    }

    const receiveFGNo = `${prefix}${runNumber}`;
    const receiveStatus = 1;
    const warehouseId = view.F_Location === 'NONE' ? '01' : '99'; 
    const runNo = runNumber;
    const docEdit = 0;

    await pool.request()
      .input('processOrderId', sql.VarChar, processOrderId)
      .query(`
        UPDATE Trans_ProcessOrderMain SET F_Status = 7 WHERE F_ProcessOrderId = @processOrderId;
        UPDATE Trans_ProcessOrderSub SET F_Status = 7 WHERE F_ProcessOrderId = @processOrderId;
      `);

    await pool.request()
      .input('F_ReceiveFGNo', sql.VarChar, receiveFGNo)
      .input('F_ReceiveFGDate', sql.Date, today)
      .input('F_ProcessOrderId', sql.VarChar, view.F_ProcessOrderId)
      .input('F_LotNumber', sql.VarChar, view.F_LotNumber)
      .input('F_ProductId', sql.VarChar, view.F_ProductId)
      .input('F_ProductName', sql.NVarChar, view.F_ProductName)
      .input('F_ProductWeightOld', sql.Float, view.F_ProductWeightOld || 0)
      .input('F_ProductWeightNew', sql.Float, view.F_ProdictWeightNew || 0)
      .input('F_TotalQtyFGReal', sql.VarChar, String(Number(view.F_TotalQtyReal) || 0))
      .input('F_TotalQtyFGReal_Roll', sql.VarChar, String(Number(view.F_TotalQtyReal_Roll) || 0))
      .input('F_TotalSend_R', sql.VarChar, String(Number(view.F_TotalQtyReal) || 0))
      .input('F_TotalSend_R_Roll', sql.VarChar, String(Number(view.F_TotalQtyReal_Roll) || 0))
      .input('F_TotalStock_R', sql.VarChar, '0')
      .input('F_TotalStock_R_Roll', sql.VarChar, '0')
      .input('F_TotalMean_R', sql.VarChar, '0')
      .input('F_TotalMeanRoll_R', sql.VarChar, '0')
      .input('F_Total_R', sql.VarChar, String(Number(view.F_TotalQtyReal) || 0))
      .input('F_TotalRoll_R', sql.VarChar, String(Number(view.F_TotalQtyReal_Roll) || 0))      .input('F_Location', sql.VarChar, view.F_Location || 'NONE')
      .input('F_Time', sql.VarChar, time)
      .input('F_ReceiveStatus', sql.Int, receiveStatus)
      .input('F_WarehouseId', sql.VarChar, warehouseId)
      .input('F_RunNo', sql.VarChar, runNo)
      .input('F_DocEdit', sql.Int, docEdit)
      .query(`
        INSERT INTO Trans_ReceiveFGHead (
          F_ReceiveFGNo, F_ReceiveFGDate, F_ProcessOrderId, F_LotNumber, F_ProductId,
          F_ProductName, F_ProductWeightOld, F_ProductWeightNew, F_TotalQtyFGReal,
          F_TotalQtyFGReal_Roll, F_TotalSend_R, F_TotalSend_R_Roll, F_TotalStock_R,
          F_TotalStock_R_Roll, F_TotalMean_R, F_TotalMeanRoll_R, F_Total_R, F_TotalRoll_R,
          F_Location, F_Time, F_ReceiveStatus, F_WarehouseId, F_RunNo, F_DocEdit
        )
        VALUES (
          @F_ReceiveFGNo, @F_ReceiveFGDate, @F_ProcessOrderId, @F_LotNumber, @F_ProductId,
          @F_ProductName, @F_ProductWeightOld, @F_ProductWeightNew, @F_TotalQtyFGReal,
          @F_TotalQtyFGReal_Roll, @F_TotalSend_R, @F_TotalSend_R_Roll, @F_TotalStock_R,
          @F_TotalStock_R_Roll, @F_TotalMean_R, @F_TotalMeanRoll_R, @F_Total_R, @F_TotalRoll_R,
          @F_Location, @F_Time, @F_ReceiveStatus, @F_WarehouseId, @F_RunNo, @F_DocEdit
        )
      `);

    res.json({
      message: 'อัปเดตสถานะสำเร็จและบันทึกใบรับ FG เรียบร้อย',
      receiveFGNo
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

  