
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido.' });
        }
        req.decode = decoded; 
        req.userId = decoded.userId;
        next();
    });
};

module.exports= { jwt, verifyToken };
