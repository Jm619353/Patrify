const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors');

const path = require('path');

require('dotenv').config();

const corsOptions = {
    origin: 'https://patrify.vercel.app',  
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  
    allowedHeaders: ['Content-Type', 'Authorization'],  
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "your-secret-key", resave: true, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'api')));

// Routes (assuming correct definitions in controllers)
const authRoutes = require("./src/app/controllers/authcontroller");
const registerRoutes = require("./src/app/controllers/registercontroller");
const registerpatrimonyRoutes = require("./src/app/controllers/patrimonycontroller");
const userinfoRoutes = require("./src/app/controllers/usercontroller");
const recpasswordRoutes = require("./src/app/controllers/recpasscontroller");
const descarteRoutes = require("./src/app/controllers/descartecontroller");

app.use('/auth', authRoutes);
app.use('/register', registerRoutes);
app.use('/patrimony', registerpatrimonyRoutes);
app.use('/user', userinfoRoutes);
app.use('/', recpasswordRoutes);
app.use('/descarte', descarteRoutes);

app.get('/test', async (req, res) => {
  try {
    res.send('hello word')
  } catch (err) {
    console.error('Erro ao conectar-se ao banco de dados', err);
    res.status(500).json({ message: 'Erro ao conectar-se ao banco de dados', error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
