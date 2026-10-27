
const pool = require("../../database/index");
const axios =require('axios');

const getUserBycnpj = (cnpj, callback) => {
    const sql = "SELECT * FROM tbl_user WHERE user_cnpj = $1";
    pool.query(sql, [cnpj], (error, results) => {
        callback(error, results);
    });
};


module.exports = { getUserBycnpj};
