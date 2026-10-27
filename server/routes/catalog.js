import express from 'express';
import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import { query, run, logAdminAction } from '../db.js';
import { authenticate, requireAdmin } from './auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/catalog/import - Importar cartas desde CSV
router.post('/import', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      for (const row of results) {
        const { name, game_type, expansion, image_url, market_price } = row;
        
        if (!name || !game_type || !image_url) {
          errorCount++;
          continue;
        }

        const id = `${game_type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        try {
          await run(
            `INSERT INTO card_catalog (id, name, game_type, expansion, image_url, market_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, name, game_type, expansion || '', image_url, Number(market_price) || 0]
          );
          successCount++;
        } catch (err) {
          console.error('Error insertando carta:', err);
          errorCount++;
        }
      }

      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error borrando archivo temporal:', err);
      });

      await logAdminAction(req.user.email, 'Importar Catálogo', `Se importaron ${successCount} cartas al catálogo global.`);
      res.json({ message: 'Importación completada', successCount, errorCount });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Error procesando archivo CSV' });
    });
});

// GET /api/catalog/search - Buscar en el catálogo
router.get('/search', async (req, res) => {
  const { game_type, q } = req.query;
  
  if (!game_type || !q) {
    return res.status(400).json({ error: 'Faltan parámetros de búsqueda (game_type, q)' });
  }

  try {
    const searchParam = `%${q}%`;
    const results = await query(
      'SELECT * FROM card_catalog WHERE game_type = ? AND name LIKE ? LIMIT 50',
      [game_type, searchParam]
    );
    res.json(results);
  } catch (err) {
    console.error('Error buscando catálogo:', err);
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
});

export default router;
