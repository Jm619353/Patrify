
const pool = require("../../database/index");

const { put } = require('@vercel/blob');
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo de itens excluídos
const filePath = path.join(__dirname, 'itensExcluidos.txt');

const { spawn } = require("child_process");

// Função para gerar número de série
function generateSerialNumber(tipo) {
    const categories = {
        'Tecnologia': 'TECH',
        'Mobiliário': 'MOBL',
        'Industrial': 'INDU',
        'Transporte': 'TRAN',
        'Logística': 'LOGI',
        'Segurança': 'SEGU',
        'Laboratorial': 'LABO',
        'Produção': 'PROD'
    };
    const prefix = categories[tipo];
    console.log(prefix)
    if (!prefix) {
        throw new Error('Categoria inválida');
    }

    const length = 12 - prefix.length;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let serialNumber = prefix;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        serialNumber += chars[randomIndex];
    }

    return serialNumber;
}


async function checkNumserieExists(name) {
    return new Promise((resolve, reject) => {
        const numserieCheckQuery = "SELECT COUNT(*) AS num_rows FROM tbl_patrimonio WHERE patr_name = $1";
        pool.query(numserieCheckQuery, [name], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.rows > 0);
            }
        });
    });
}


const insertPatrimony = async (name, valor, dt_compra, local, ativoinativo, depreciacao, tipo, user_id) => {
    try {
        
        const serialNumber = await generateSerialNumber(tipo);
        const values = [name, valor, dt_compra, local, ativoinativo, depreciacao, tipo, serialNumber, user_id];

      const insertPatrimonyQuery = `
        INSERT INTO tbl_patrimonio
        (patr_name, patr_valor, patr_dt_compr, patr_local, patr_ativoinativo, patr_depreciacao, patr_tipo, patr_codigoserie, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING patr_id;
      `;
      const result = await pool.query(insertPatrimonyQuery, values);
  
      if (result.rowCount === 1) {
        const results = result.rows
        return results[0].patr_id; // Return the newly inserted patrimony ID
      } else {
        throw new Error("Erro ao inserir novo patrimônio.");
      }
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao realizar cadastro no banco de dados. Revise as informações."); // More generic error message for the user
    }
  };
  

  const updatePatrimony = async (updateValues, patr_id, user_id, res) => {
    try {
      const updateQuery = `
        UPDATE tbl_patrimonio
        SET patr_name = $1, patr_valor = $2,  patr_dt_compr = $3,
            patr_local = $4, patr_ativoinativo = $5, patr_depreciacao = $6,
            patr_tipo = $7
        WHERE patr_id = $8;
      `;
    const updateResult = await pool.query(updateQuery, [
      updateValues.patr_name,
      updateValues.patr_valor,
      updateValues.patr_dt_compr,
      updateValues.patr_local,
      updateValues.patr_ativoinativo,
      updateValues.patr_depreciacao,
      updateValues.patr_tipo,
      patr_id,

    ]);

    if (updateResult.rowCount === 0) {
      throw new Error('Patrimony not found');
    }

    res.status(200).json({ message: 'Patrimônio atualizado com sucesso.' });
  } catch (error) {
    throw error;
    res.status(500).json({ message: 'Erro interno do servidor: ' + error.message });
  }
};
  
    



    const deletePatrimony = (patr_id, user_id, res) => {
    const deletePatrimonyQuery = "DELETE FROM tbl_patrimonio WHERE patr_id = $1 AND user_id = $2";

    pool.query(deletePatrimonyQuery, [patr_id, user_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }

        if (results && results.rowCount > 0) { // Assuming results is an object with a rowCount property
            res.status(200).json({ message: "Patrimônio excluído com sucesso." });
        } else {
            res.status(404).json({ message: "Patrimônio não encontrado." });
        }
    });
};



module.exports = { insertPatrimony,checkNumserieExists, updatePatrimony, deletePatrimony, generateSerialNumber };
