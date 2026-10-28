import express from 'express';
import { query, run, get, logAdminAction } from '../db.js';
import { authenticate, requireAdmin } from './auth.js';

const router = express.Router();

// GET /api/products - Listar catálogo (activos)
router.get('/', async (req, res) => {
  const { game_type } = req.query;
  try {
    let sql = 'SELECT * FROM products WHERE is_active = 1';
    let params = [];
    if (game_type) {
      sql += ' AND game_type = ?';
      params.push(game_type);
    }
    const products = await query(sql, params);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar el catálogo' });
  }
});

// GET /api/products/all - Listar todo el inventario (Admin)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await query('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar el inventario' });
  }
});

// POST /api/products - Crear nuevo producto (Admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { 
    name, price, category, image_url, description, stock, expansion, 
    is_promo, region, pulled_from, card_condition, game_type, gallery_images,
    platform, completeness, is_tournament_staple, is_first_edition,
    subcategory, market_price, market_price_low, market_price_high
  } = req.body;
  
  if (!name || !price || !category || !image_url) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (Number(price) <= 0) return res.status(400).json({ error: 'Precio inválido' });
  if (Number(stock) < 0) return res.status(400).json({ error: 'Stock inválido' });

  const id = 'prod_' + Date.now().toString(36);

  try {
    await run(
      `INSERT INTO products (
        id, name, price, category, image_url, description, stock, expansion, 
        is_promo, region, pulled_from, card_condition, game_type, gallery_images,
        platform, completeness, is_tournament_staple, is_first_edition,
        subcategory, market_price, market_price_low, market_price_high
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, Number(price), category, image_url, description, Number(stock), expansion, 
        is_promo ? 1 : 0, region || '', pulled_from || '', card_condition || '', game_type || 'POKEMON', gallery_images || '[]',
        platform || '', completeness || '', is_tournament_staple ? 1 : 0, is_first_edition ? 1 : 0,
        subcategory || '', market_price ? Number(market_price) : 0, 
        market_price_low ? Number(market_price_low) : 0, market_price_high ? Number(market_price_high) : 0
      ]
    );
    await logAdminAction(req.user.email, 'Crear Producto', `Se agregó el producto "${name}" (Precio: $${price} MXN, Stock: ${stock})`);
    const newProduct = await get('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/products/:id - Actualizar producto (Admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { 
    name, price, category, image_url, description, stock, expansion, 
    is_promo, region, pulled_from, card_condition, game_type, gallery_images,
    platform, completeness, is_tournament_staple, is_first_edition,
    subcategory, market_price, market_price_low, market_price_high
  } = req.body;

  if (Number(price) <= 0) return res.status(400).json({ error: 'Precio inválido' });
  if (Number(stock) < 0) return res.status(400).json({ error: 'Stock inválido' });

  try {
    const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

    await run(
      `UPDATE products 
       SET name=?, price=?, category=?, image_url=?, description=?, stock=?, expansion=?, 
           is_promo=?, region=?, pulled_from=?, card_condition=?, game_type=?, gallery_images=?,
           platform=?, completeness=?, is_tournament_staple=?, is_first_edition=?,
           subcategory=?, market_price=?, market_price_low=?, market_price_high=?
       WHERE id=?`,
      [
        name, Number(price), category, image_url, description, Number(stock), expansion, 
        is_promo ? 1 : 0, region || '', pulled_from || '', card_condition || '', game_type || 'POKEMON', 
        gallery_images !== undefined ? gallery_images : (existing.gallery_images || '[]'),
        platform !== undefined ? platform : (existing.platform || ''),
        completeness !== undefined ? completeness : (existing.completeness || ''),
        is_tournament_staple !== undefined ? (is_tournament_staple ? 1 : 0) : (existing.is_tournament_staple || 0),
        is_first_edition !== undefined ? (is_first_edition ? 1 : 0) : (existing.is_first_edition || 0),
        subcategory !== undefined ? subcategory : (existing.subcategory || ''),
        market_price !== undefined ? Number(market_price) : (existing.market_price || 0),
        market_price_low !== undefined ? Number(market_price_low) : (existing.market_price_low || 0),
        market_price_high !== undefined ? Number(market_price_high) : (existing.market_price_high || 0),
        id
      ]
    );
    await logAdminAction(req.user.email, 'Editar Producto', `Se actualizó el producto "${name}" (ID: ${id}) - Nuevo Precio: $${price} MXN, Nuevo Stock: ${stock}`);
    const updatedProduct = await get('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/products/:id - Soft Delete (Admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await get('SELECT name FROM products WHERE id = ?', [id]);
    await run('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    await logAdminAction(req.user.email, 'Eliminar Producto', `Se eliminó el producto "${existing ? existing.name : id}" (ID: ${id})`);
    res.json({ message: 'Producto eliminado del catálogo (soft delete)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al borrar producto' });
  }
});

export default router;
