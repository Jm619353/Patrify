const express = require("express");
const bcrypt = require("bcrypt");
const mysqConnection = require("../../database");
const { insertCompany,checkIfCnpjExists } = require("../models/registerModel");

const router = express.Router();

//-----------------cadastro-----------------//
router.post('/registeruser', async (request, response) => {
    try {
        const { name, cnpj, telefone1, telefone2, email, razaoSocial,  atividadeEconomica, endereco,  password } = request.body;
        const emailExists = await checkIfCnpjExists(cnpj);
        
        if (emailExists) {
            return response.status(400).json({ message: "Empresa já existente!" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        insertCompany(name, cnpj, telefone1, telefone2, email, razaoSocial,  atividadeEconomica, endereco, hashedPassword, response);
        
    } catch (error) {
        response.status(400).json({ message: "Erro interno do servidor." });
    }
});


module.exports = router;
