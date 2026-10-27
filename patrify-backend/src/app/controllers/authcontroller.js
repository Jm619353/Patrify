const express = require("express");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const JWT_SECRET = process.env.JWT_SECRET;

const { jwt, verifyToken } = require('../midleware/jwtmiddleware');
const { getUserBycnpj } = require('../models/authModel');

const router = express.Router();

const jwtSecret = JWT_SECRET; 

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 10, 
    message: 'Too many login attempts. Please try again later.'
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { cnpj, password } = req.body;
        if (!cnpj || !password) {
            return res.status(400).json({ message: "CNPJ and password are required." });
        }

       await getUserBycnpj(cnpj, async (error, results) => {
            if (error) {
                return res.status(500).json({ message: 'Error fetching user data.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const userId = results.rows[0].user_id;
            const hashedPassword = results.rows[0].user_password;
            const passwordMatch = await bcrypt.compare(password, hashedPassword);
            
            if (passwordMatch) {
                const token = jwt.sign({ cnpj: cnpj, userId: userId }, jwtSecret, { expiresIn: '2h' });

                return res.status(200).json({ token });
            } else {
                return res.status(400).json({ message: "Invalid credentials." });
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
});
 


router.get('/signed', verifyToken, async (req, res) => {
    try {
        if (!req.decode || !req.decode.cnpj) {
            return res.status(401).json({ message: 'Invalid token. CNPJ not found.' });
        }

        const cnpj = req.decode.cnpj;

        getUserBycnpj(cnpj, (error, results) => {
            if (error) {
                return res.status(500).json({ message: 'Internal server error.' });
            }

            if (results.length != 0) {
               
                // const usuario = results[0];
                return res.status(200).json("usuario já logado");
            } else {
                return res.status(404).json({ message: 'User not found.' });
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
