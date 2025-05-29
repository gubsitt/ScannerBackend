const { sql, poolPromise } = require('../config/dbConfig');

exports.login = async (req, res) => {
  const { userID, password } = req.body;

  console.log('📥 Login request received:', { userID, password: '[HIDDEN]' });

  try {
    const pool = await poolPromise;

    console.log(`🔐 Checking login for userID: ${userID}`);

    const result = await pool.request()
      .input('userID', sql.VarChar, userID)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM View_UserLogin WHERE F_UserID = @userID AND F_UserPassword = @password');

    if (result.recordset.length > 0) {
      console.log('✅ Login successful for userID:', userID);
      res.json({ success: true, user: result.recordset[0] });
    } else {
      console.warn('❌ Invalid login attempt for userID:', userID);
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('💥 Login error for userID:', userID, '→', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
