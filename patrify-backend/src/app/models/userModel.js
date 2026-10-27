

const pool = require("../../database/index");



const userinfo = async (userId, res) => {
  try {
    const getuserinfo = "SELECT * FROM tbl_user WHERE user_id = $1";
    const results = await pool.query(getuserinfo, [userId]);

    if (results.rows.length > 0) {
      res.status(200).json({ status: "success", patrimonios: results.rows });
    } else {
      // Improved error message with clear explanation
      res.status(404).json({
        status: "error",
        message: `Nenhum usuário encontrado com o ID: ${userId}.`
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Erro ao buscar informações no banco de dados." });
  }
};


const updateUser = (name, telefone, email, cnpj, matriz_filial, porte, hashedPassword, userId) => {
    const updateUserQuery = "UPDATE tbl_user SET user_name=$1, user_telefone=$2, user_email=$3, user_cnpj=$4, user_matrizfilial=$5, user_porte=$6, user_password=$7 WHERE user_id=$8";
    pool.query(updateUserQuery, [name, telefone, email, cnpj, matriz_filial, porte, hashedPassword, userId], (err, results) => {
        if (err) {
            console.error(err);
            return response.status(500).json({ message: "Internal server error during user update." });
        }

        if (results.affectedRows > 0) {
            response.status(200).json({ message: "User information updated successfully!" });
        } else {
            response.status(400).json({ message: "No information was updated. Check the provided data." });
        }
    });
}


// Function to check if the provided password is correct
async function checkPassword(userId, password) {
    const getPasswordQuery = "SELECT user_password FROM tbl_user WHERE user_id=$1";
    return new Promise((resolve, reject) => {
        pool.query(getPasswordQuery, [userId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (results.length > 0) {
                    const hashedPassword = results[0].user_password;

                    bcrypt.compare(password, hashedPassword, (err, isMatch) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(isMatch);
                        }
                    });
                } else {
                    resolve(false);
                }
            }
        });
    });
}


async function checkIfUserExists(userId) {
    const checkUserQuery = "SELECT * FROM tbl_user WHERE user_id = $1";
    return new Promise((resolve, reject) => {
        pool.query(checkUserQuery, [userId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.length > 0);
            }
        });
    });
}

module.exports={userinfo,updateUser,checkPassword,checkIfUserExists};
