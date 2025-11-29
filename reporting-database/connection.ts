import mysql from 'mysql2/promise'

const db = mysql.createPool({
    host: 'mysql',
    user: 'alfred_reporting_user',
    password: 'alfred_reporting_password',
    database: 'alfred_reporting_db',
    waitForConnections: true,
    connectionLimit: 5,
    idleTimeout: 10000,
})

export default db
