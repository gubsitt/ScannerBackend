const { sql, poolPromise } = require('../config/dbConfig');

exports.login = async (req, res) => {
  const { userID, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userID', sql.VarChar, userID)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM View_UserLogin WHERE F_UserID = @userID AND F_UserPassword = @password');
    if (result.recordset.length > 0) {
      res.json({ success: true, user: result.recordset[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};