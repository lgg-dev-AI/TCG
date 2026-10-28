import express from 'express';
import { query, run, get, logAdminAction } from '../db.js';
import { authenticate, requireAdmin } from './auth.js';

const router = express.Router();

// GET /api/categories - Obtener todas las categorías y subcategorías
router.get('/', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY order_index ASC, name ASC');
    res.json(categories);
  } catch (error) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({ error: 'Error al consultar categorías' });
  }
});

// POST /api/categories - Crear categoría o subcategoría (Admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, parent_id, icon, color, order_index } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }

  const id = 'cat_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    await run(
      `INSERT INTO categories (id, name, slug, parent_id, icon, color, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        slug,
        parent_id || null,
        icon || 'Package',
        color || '#3b82f6',
        Number(order_index) || 0
      ]
    );

    await logAdminAction(
      req.user.email,
      'Crear Categoría',
      `Se creó la categoría "${name}" (${parent_id ? 'Subcategoría de ' + parent_id : 'Principal'})`
    );

    const created = await get('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// PUT /api/categories/:id - Actualizar categoría (Admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, icon, color, order_index } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    const existing = await get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    await run(
      `UPDATE categories 
       SET name = ?, slug = ?, parent_id = ?, icon = ?, color = ?, order_index = ?
       WHERE id = ?`,
      [
        name.trim(),
        slug,
        parent_id !== undefined ? (parent_id || null) : existing.parent_id,
        icon || existing.icon,
        color || existing.color,
        order_index !== undefined ? Number(order_index) : existing.order_index,
        id
      ]
    );

    await logAdminAction(req.user.email, 'Editar Categoría', `Se editó la categoría "${name}" (ID: ${id})`);
    const updated = await get('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// DELETE /api/categories/:id - Eliminar categoría (Admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Eliminar también las subcategorías que dependan de ella
    await run('DELETE FROM categories WHERE parent_id = ?', [id]);
    await run('DELETE FROM categories WHERE id = ?', [id]);

    await logAdminAction(
      req.user.email,
      'Eliminar Categoría',
      `Se eliminó la categoría "${existing.name}" y sus subcategorías vinculadas.`
    );

    res.json({ message: 'Categoría eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

export default router;
