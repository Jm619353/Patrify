const express = require("express");
const axios = require('axios');

const router = express.Router();
const GOOGLE_API = process.env.GOOGLE_API

router.post('/listlocais', async (req, res) => {
  try {
    const { tipoPatrimonio, localizacao } = req.body;
    const apiKey = GOOGLE_API;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiKey}&location=${localizacao}&radius=5000&type=recycling_center&keyword=${tipoPatrimonio}`;
    const { data: { results } } = await axios.get(url);
    
    if (results.length > 0) {
      const locais = await Promise.all(results.map(async (local) => {
        const urlphone = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${local.place_id}&key=${apiKey}`;
        const { data } = await axios.get(urlphone);
        
        const phone = data.result.formatted_phone_number;
        const urlLocal = data.result.url;
        const websiteLocal = data.result.website;
        
        return {
          ...local,
          phone,
          url: urlLocal,
          website: websiteLocal
        };
      }));
      
      res.status(200).json({ localizacoes: locais });
    } else {
      res.status(404).json({ message: `Não foi possível achar locais de descarte de ${tipoPatrimonio}.` });
    }
  } catch (error) {
    console.error('Error fetching recycling centers:', error);
    res.status(500).json({ message: 'An error occurred while searching for locations.' });
  }
});


module.exports = router;