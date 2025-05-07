const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'service',   
    server: '172.16.102.242',    
    database: 'WMS_NewWarehouse',
    options: {
        enableArithAbort: true,
        encrypt: false
        
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to database');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
    sql, poolPromise
};