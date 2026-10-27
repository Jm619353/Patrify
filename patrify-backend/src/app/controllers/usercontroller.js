const express = require("express");
const bcrypt = require("bcrypt");
const mysqConnection = require("../../database");
// const jwt = require('jsonwebtoken');


const { verifyToken } = require("../midleware/jwtmiddleware")
const { userinfo, updateUser,checkPassword,checkIfUserExists } = require("../models/userModel");

const router = express.Router();


router.get('/profile', verifyToken, async (req, res) => {
    try {
        const  userId  = req.userId;
        userinfo(userId, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error",message: "Erro interno do servidor." });
    }
});

router.put('/update', verifyToken, async (request, response) => {
    try {
        const  userId  = req.userId;
        const { name, telefone, email, cnpj, matriz_filial, porte, password } = request.body;

        const userExists = await checkIfUserExists(userId);

        if (!userExists) {
            return response.status(404).json({ message: "Usuário não encontrado!" });
        }

        const isPasswordCorrect = await checkPassword(userId, password);

        if (!isPasswordCorrect) {
            return response.status(401).json({ message: "Senha incorreta. Acesso não autorizado!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

       updateUser(name, telefone, email, cnpj, matriz_filial, porte, hashedPassword, userId)


    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Internal server error." });
    }
});





module.exports = router;