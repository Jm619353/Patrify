// const mysql = require("mysql");
// const dbConfig = require("../config/db.config");

// const mysqlConnection = mysql.createPool({
//     host: dbConfig.DB_HOST,
//     user: dbConfig.DB_USER,
//     password: dbConfig.DB_PASS,
//     database: dbConfig.DB_DATABASE
// })

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
})

module.exports = pool;