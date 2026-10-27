// Importações de módulos:
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const {  sendRecoveryLinkByEmail,checkIfEmailExists,updatepassword, userinfo } = require('../models/recpassModel');

const router = express.Router();

// Endpoint POST '/password-recovery': Este endpoint lida com a solicitação de recuperação de senha. Ele espera receber um e-mail no corpo da solicitação. Em seguida, verifica se o e-mail existe no banco de dados, gera um token JWT contendo o e-mail, constrói um link de recuperação de senha com esse token e envia o link para o e-mail fornecido.
router.post('/password-recovery', async (req, res) => {
    try {
        const { cnpj, email } = req.body;

        // Verifique se o e-mail existe no banco de dados
        const userExists = await checkIfEmailExists(email, cnpj);
        if (!userExists) {
            return res.status(400).json({ message: "E-mail não cadastrado!" });
        }

        await userinfo(email, cnpj, async (error, results) =>{
            if (error) {
                return res.status(500).json({ message: 'Error fetching user data.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const userId = results.rows[0].user_id;
        // Gerar um token JWT contendo o ID do usuário
        const token = jwt.sign({ email, userId }, process.env.JWT_SECRET, { expiresIn: '15min' });

        // Construir o link de recuperação de senha com o token
        const recoveryLink = `http://localhost:4200/recsenha?token=${token}`;

        // Enviar o link de recuperação para o e-mail do usuário
        await sendRecoveryLinkByEmail(email, recoveryLink);

        res.status(200).json({ message: "Um e-mail com instruções foi enviado para a recuperação da senha." });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

// Endpoint POST '/reset-password': Este endpoint lida com a troca de senha utilizando o token recebido por e-mail.
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        // Verificar se o token é válido
        

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(400).json({ message: "Token inválido ou expirado." });
            }

            // Atualizar a senha do usuário
            const email = decoded.email;
            const userid = decoded.userId
            const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash da nova senha

            // Atualizar a senha no banco de dados
            updatepassword(hashedPassword, email, userid, res);
           
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

module.exports = router;
