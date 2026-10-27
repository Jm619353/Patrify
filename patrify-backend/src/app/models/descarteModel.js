const mysqConnection = require("../../database/index");

function insertLocal(name, telefone, email, cnpj, local, response, callback) {
    // Comando SQL para inserção
    const sql = 'INSERT INTO tbl_descarte (desc_name, desc_telefone, desc_email, desc_cnpj, desc_local) VALUES (?, ?, ?, ?, ?)';
    
    // Parâmetros para a query SQL
    const values = [name, telefone, email, cnpj, local];
    
    // Executar a query SQL
    mysqConnection.query(sql, values, function (error, results, fields) {
        if (error) {
            console.error('Erro ao inserir dados: ' + error.message);
            callback(error); // Chamando o callback com o erro
        } else {
            callback(null); // Chamando o callback sem erros
        }
    });
}


function listLocais(response, callback) {
    const sqllists = 'SELECT * FROM tbl_descarte';
    mysqConnection.query(sqllists, function (error, results, fields) {
        if (error) {
            console.error('Erro ao listar dados: ' + error.message);
            callback(error); 
        } else {
            console.log('Dados listados com sucesso.');
            callback(null, results); 
        }
    });
}

function listbyLocal(local, response, callback) {
     const sqllists = 'SELECT * FROM tbl_descarte WHERE desc_local = ?';
    
     mysqConnection.query(sqllists, [local], function (error, results, fields) {
        if (error) {
            console.error('Erro ao listar dados por local: ' + error.message);
            callback(error, null); 
        } else {
            console.log('Dados listados com sucesso por local.');
            callback(null, results); 
        }
    });
}



  module.exports = { insertLocal, listLocais, listbyLocal };