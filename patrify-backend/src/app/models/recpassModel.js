const nodemailer = require('nodemailer');
const pool = require("../../database/index");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Função para verificar se o email está no formato correto
function isValidEmail(email) {
    // Expressão regular para verificar o formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}



const userinfo = (email, cnpj, callback) => {
    const sql = "SELECT * FROM tbl_user WHERE user_cnpj = $1 AND user_email = $2";
    pool.query(sql, [cnpj, email], (error, results) => {
        callback(error, results);
    });
}; 

// Função assíncrona que verifica se o e-mail fornecido já está cadastrado no banco de dados.
async function checkIfEmailExists(email, cnpj) {
    console.log(email);
    // Verifica se o email está no formato correto antes de prosseguir
    // if (!isValidEmail(email)) {
    //     throw new Error('Email no formato incorreto.');
    // }

    return new Promise((resolve, reject) => {
        const emailCheckQuery = "SELECT COUNT(*) AS num_rows FROM tbl_user WHERE user_email = $1 AND user_cnpj = $2";
        pool.query(emailCheckQuery, [email, cnpj], (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (results.rows.length > 0) {
                    resolve(results.rows[0].num_rows > 0);
                } else {
                    resolve(false); 
                }
            }
        });
    });
}


// Função para enviar o link de recuperação para o e-mail do usuário
async function sendRecoveryLinkByEmail(email, recoveryLink) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Recuperação de Senha',
        html: `Clique no link a seguir para recuperar sua senha: <a href="${recoveryLink}">${recoveryLink}</a>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`E-mail enviado: ${info.response}`);
    } catch (error) {
        console.error(`Erro ao enviar e-mail: ${error.message}`);
        throw error;
    }
}

const updatepassword = (hashedPassword, email, userid, res) => {
    console.log(userid)
    const updatePasswordQuery = "UPDATE tbl_user SET user_password = $1 WHERE user_email = $2 AND user_id = $3";
    pool.query(updatePasswordQuery, [hashedPassword, email, userid], (updateErr, updateResults) => {
        if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ message: "Erro ao atualizar senha." });
        }
        res.status(200).json({ message: "Senha atualizada com sucesso." });
    });
}


  
  
module.exports = {  sendRecoveryLinkByEmail,checkIfEmailExists,updatepassword, userinfo };
