const pool = require("../../database/index");

const insertCompany = async (name, cnpj, telefone1, telefone2, email, razaoSocial, atividadeEconomica, endereco, hashedPassword, response) => {
    try {
        const insertCompanyQuery = `
            INSERT INTO tbl_user(user_name, user_telefone1, user_telefone2, user_email, user_cnpj, user_razaoSocial, user_endereco, atividadeEconomica, user_password)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

        const { rowCount } = await pool.query(insertCompanyQuery, [name, telefone1, telefone2, email, cnpj, razaoSocial, endereco, atividadeEconomica, hashedPassword]);

        if (rowCount > 0) {
            response.status(200).json({ message: "Cadastro realizado com sucesso. Faça login para acessar a plataforma!" });
        } else {
            throw new Error("Erro ao tentar realizar cadastro no banco de dados. Revise as informações.");
        }
    } catch (error) {
        console.error('Error inserting company:', error);
        response.status(400).json({ message: "Erro ao tentar realizar cadastro no banco de dados. Revise as informações." });
    }
}


async function checkIfCnpjExists(cnpj) {
    return new Promise((resolve, reject) => {
        const cnpjCheckQuery = "SELECT * FROM tbl_user WHERE user_cnpj = $1";
        pool.query(cnpjCheckQuery, [cnpj], (err, results) => {
            if (err) {
                reject(err);
                console.log(err);
            } else {
                if (results.rowCount > 0) {
                    reject(new Error("O CNPJ já existe na tabela."));
                } else {
                    resolve();
                }
            }
        });
    });
}



module.exports = {  insertCompany,checkIfCnpjExists };
