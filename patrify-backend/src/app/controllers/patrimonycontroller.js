const express = require("express");
const pool = require("../../database/index");
const multer = require('multer');
const {verifyToken} = require("../midleware/jwtmiddleware")
const { insertPatrimony,checkNumserieExists, updatePatrimony, deletePatrimony, generateSerialNumber } = require("../models/patrimonyModel");
const path = require('path')
const router = express.Router();


(async () => {
 
const multerGoogleStorage = require('multer-google-storage');

  
const upload = multer({
  storage:  multerGoogleStorage.storageEngine()
});


  router.post('/image/:id', verifyToken , upload.single('image'), async (req, res) => {
    const id = parseInt(req.params.id);
    const user_id = req.userId;
    const form =  req.file;
    const uploadedImage = form;
    if (!uploadedImage) {
      return res.status(400).send('Nenhum arquivo de imagem enviado');
    }
    const filePath = uploadedImage.path;
    try { 
     const  imageUrl =  filePath;
     const updatequery = "UPDATE tbl_patrimonio SET imagem = $1 WHERE patr_id = $2 AND user_id = $3";
     pool.query(updatequery, [imageUrl, id, user_id], (err, results) => {
         if (err) {
             console.error('Error updating data:', err);
         } else if (results.rowCount > 0) {
             res.status(200).json({ message: 'Imagem atualizada com sucesso' });
         } else {
             console.log(results)
         }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });


router.post('/registerpatrimonio',verifyToken,   async (req, res) => {
    try {
        const { name, valor, dt_compra, local, ativoinativo, depreciacao, tipo } = req.body;
        const  user_id  = req.userId;
        const numserieExists = await checkNumserieExists(name);
        if (numserieExists) {
            return res.status(400).json({ message: "Patrimônio já cadastrado!" });
        }

        const serialNumber = await generateSerialNumber(tipo);


        const newPatrimonyId = await insertPatrimony(name, valor, dt_compra, local, ativoinativo, depreciacao, tipo, user_id);
        return res.status(200).json({ newPatrimonyId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});



router.put('/filter', verifyToken, async (req, res) => {
  try {
    const user_id = req.userId;
    const { name, status, preco, data_aquisicao, condicao, tipo, pageSize, offset } = req.body; // Receive pageSize and offset

    let sql = "SELECT * FROM tbl_patrimonio WHERE user_id = $1";
    const values = [user_id];

    let paramIndex = 2; 

    if (status) {
      sql += ` AND patr_ativoinativo = $${paramIndex++}`;
      values.push(status === 'Ativo' || status === 'Não ativo' ? status : 'Ambos'); 
    }

    if (preco) {
      let priceFilter = "";
      switch (preco) {
        case "menor que cinquenta":
          priceFilter = `patr_valor < $${paramIndex}`;
          values.push(50);
          paramIndex++;
          break;
        case "51 a 100":
          priceFilter = `patr_valor BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          values.push(51, 100);
          paramIndex += 2;
          break;
        case "101 a 200":
          priceFilter = `patr_valor BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          values.push(101, 200);
          paramIndex += 2;
          break;
        case "201 a 500":
          priceFilter = `patr_valor BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          values.push(201, 500);
          paramIndex += 2;
          break;
        case "501 a 4000":
          priceFilter = `patr_valor BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          values.push(501, 4000);
          paramIndex += 2;
          break;
        case "maior que 4000":
          priceFilter = `patr_valor > $${paramIndex}`;
          values.push(4000);
          paramIndex++;
          break;
        default:
          break;
      }
      if (priceFilter) {
        sql += ` AND ${priceFilter}`;
      }
    }

    if (data_aquisicao) {

      let startDate;
      let endDate;

      switch (data_aquisicao) {
        case "qualquer data":
          break;
          case 'ultimos 7 dias':
            startDate = `'${new Date(new Date() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}'`;
            endDate = `'${new Date().toISOString().split('T')[0]}'`;
            break;
        case 'ultimos 30 dias':
            startDate = `'${new Date(new Date() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}'`;
            endDate = `'${new Date().toISOString().split('T')[0]}'`;
            break;
        case 'ultimos 2 meses':
            startDate = `'${new Date(new Date() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}'`;
            endDate = `'${new Date().toISOString().split('T')[0]}'`;
            break;
        case 'ultimos 6 meses':
            startDate = `'${new Date(new Date() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}'`;
            endDate = `'${new Date().toISOString().split('T')[0]}'`;
            break;
        case 'ultimo 1 ano':
            startDate = `'${new Date(new Date() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}'`;
            endDate = `'${new Date().toISOString().split('T')[0]}'`;
            break;
        case 'mais de 1 ano':
            startDate =`'${new Date('1350-01-01').toISOString().split('T')[0]}'`;  
            endDate = `'${new Date(new Date() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}'`;
        default:
          console.warn(`Unrecognized date filter: ${data_aquisicao}`); // Handle unexpected cases
      }
      sql += ` AND (patr_dt_compr BETWEEN $${paramIndex} AND $${paramIndex + 1})`;
      values.push(startDate, endDate);
      paramIndex+= 2;
    }
    if (condicao) {
      sql += ` AND patr_depreciacao = $${paramIndex++}`;
      values.push(condicao);
    }
    if (tipo) {
      if (tipo === 'Todos') {
      } else {
        sql += ` AND patr_tipo = $${paramIndex++}`;
        values.push(tipo);
      }
    }
    if (name) {
      let orderClause = "";
      switch (name) {
        case "A-Z":
          orderClause = "ORDER BY patr_name ASC";
          break;
        case "Mais antigo":
          orderClause = "ORDER BY patr_dt_compr ASC";
          break;
        case "Z-A":
          orderClause = "ORDER BY patr_name DESC";
          break;
        default:
          break;
      }
      sql += ` ${orderClause}`;
    } else {
      sql += ` ORDER BY patr_id DESC`; 
    }

    sql += ` LIMIT $${paramIndex++}`; // Add LIMIT clause
    values.push(pageSize); // Add pageSize as a parameter
    sql += ` OFFSET $${paramIndex}`; // Add OFFSET clause
    values.push(offset); // Add offset as a parameter
    
    pool.query(sql, values, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao executar a consulta." });
      } else {
        if (results.length === 0) {
          return res.status(200).json({ message: "Nenhum patrimônio encontrado." });
        }
        const patrimoniosComImagensBase64 = results.rows.map((patrimonio) => {
          if (patrimonio.imagem) {
            patrimonio.imagem = `${patrimonio.imagem}`; 
          }
          return patrimonio;
        });
        res.status(200).json({ patrimonios: patrimoniosComImagensBase64 });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});
// Rota para atualizar um patrimônio
router.put('/update/:patr_id', verifyToken, async (req, res) => {
    try {
        const patr_id = req.params.patr_id;
        const user_id  = req.userId;
        const { name, valor,  dt_compr, local, ativoinativo,  depreciacao, tipo } = req.body;
       console.log(1232424124123);
          const updateValues = {
            patr_name: name,
            patr_valor: valor,
            patr_dt_compr: dt_compr,
            patr_local: local,
            patr_ativoinativo: ativoinativo,
            patr_depreciacao: depreciacao,
            patr_tipo: tipo
        };
      console.log(updateValues)
        updatePatrimony(updateValues, patr_id, user_id, res)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error: " + error.message });
    }
}); 

router.delete('/delete/:patrid', verifyToken, async (req, res) => {
    try {
        const patr_id = req.params.patrid;
        const  user_id  = req.userId;
        deletePatrimony(patr_id, user_id, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

})();



module.exports = router;
