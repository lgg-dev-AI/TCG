import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, FolderPlus, Sparkles, Gamepad2, ShieldCheck, 
  Package, Check, X, RefreshCw, Layers, Tag
} from 'lucide-react';
import { 
  apiGetCategories, 
  apiCreateCategory, 
  apiUpdateCategory, 
  apiDeleteCategory, 
  DEFAULT_FALLBACK_CATEGORIES,
  type CategoryItem 
} from '../api';
import type { Product } from './ProductItem';

interface CategoryManagerProps {
  inventory: Product[];
  onCategoriesChanged?: (categories: CategoryItem[]) => void;
}

export default function CategoryManager({ inventory, onCategoriesChanged }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modal / Form state for adding/editing
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formIcon, setFormIcon] = useState('Package');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await apiGetCategories();
      setCategories(data);
      onCategoriesChanged?.(data);
    } catch (e) {
      console.error('Error cargando categorías:', e);
      setCategories(DEFAULT_FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Categorías principales (sin parent_id)
  const parentCategories = categories.filter(c => !c.parent_id);

  // Subcategorías de un padre
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parent_id === parentId);
  };

  // Contar productos asociados a una categoría o subcategoría
  const countProducts = (cat: CategoryItem) => {
    return inventory.filter(p => 
      p.category === cat.slug || 
      p.subCategory === cat.slug || 
      (cat.slug === 'tcg' && (p.category === 'single' || p.category === 'booster_box' || p.category === 'etb' || p.category === 'blister')) ||
      (cat.slug === 'videogames' && p.category === 'videogame') ||
      (cat.slug === 'accessories' && p.category === 'accessory')
    ).length;
  };

  const handleOpenAdd = (defaultParentId = '') => {
    setEditingId(null);
    setFormName('');
    setFormParentId(defaultParentId);
    setFormIcon('Package');
    setFormColor('#3b82f6');
    setErrorMsg('');
    setSuccessMsg('');
    setShowForm(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormParentId(cat.parent_id || '');
    setFormIcon(cat.icon || 'Package');
    setFormColor(cat.color || '#3b82f6');
    setErrorMsg('');
    setSuccessMsg('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      if (editingId) {
        await apiUpdateCategory(editingId, {
          name: formName.trim(),
          parent_id: formParentId || null,
          icon: formIcon,
          color: formColor
        });
        setSuccessMsg(`Categoría "${formName}" actualizada exitosamente.`);
      } else {
        await apiCreateCategory({
          name: formName.trim(),
          parent_id: formParentId || null,
          icon: formIcon,
          color: formColor
        });
        setSuccessMsg(`Categoría "${formName}" creada exitosamente.`);
      }

      setShowForm(false);
      await loadCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${name}"? Si es una categoría principal, también se eliminarán sus subcategorías vinculadas.`)) {
      return;
    }

    try {
      await apiDeleteCategory(id);
      setSuccessMsg(`Categoría "${name}" eliminada.`);
      await loadCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert('Error al eliminar categoría: ' + err.message);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('¿Deseas restaurar el árbol recomendado de categorías oficial de PokéVault (TCGs, Videojuegos, Accesorios, Coleccionables)?')) {
      return;
    }
    localStorage.removeItem('pv_custom_categories');
    setCategories(DEFAULT_FALLBACK_CATEGORIES);
    onCategoriesChanged?.(DEFAULT_FALLBACK_CATEGORIES);
    setSuccessMsg('Categorías predeterminadas restauradas.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Renderizador de Íconos
  const renderIcon = (iconName?: string, color = '#ffcb05') => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={16} color={color} />;
      case 'Gamepad2': return <Gamepad2 size={16} color={color} />;
      case 'ShieldCheck': return <ShieldCheck size={16} color={color} />;
      case 'Layers': return <Layers size={16} color={color} />;
      default: return <Package size={16} color={color} />;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header del Gestor */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>
            📁 Gestor Jerárquico de Categorías & Subcategorías
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Estructura el catálogo de tu tienda para que tus clientes puedan navegar fluidamente entre TCGs, Videojuegos, Consolas y Accesorios.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleResetDefaults}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
            title="Restablecer categorías base"
          >
            <RefreshCw size={14} /> Restaurar Base
          </button>
          <button
            onClick={() => handleOpenAdd('')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '8px 16px' }}
          >
            <Plus size={16} /> Nueva Categoría Principal
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(52, 211, 153, 0.12)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#34d399',
          fontSize: '13px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Formulario Modal Agregar / Editar */}
      {showForm && (
        <form onSubmit={handleSave} className="glass" style={{
          backgroundColor: 'rgba(22, 27, 38, 0.85)',
          border: '1.5px solid var(--primary)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'white', margin: 0 }}>
              {editingId ? '✏️ Editar Categoría' : '➕ Crear Nueva Categoría'}
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {errorMsg && (
            <div style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '12px' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {/* Nombre */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                required
                placeholder="ej: Disney Lorcana, PlayStation 5, Funko Pop"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Categoría Padre (Para Subcategorías) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Pertenece a (Categoría Principal)
              </label>
              <select
                value={formParentId}
                onChange={e => setFormParentId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">Ninguna (Es una Categoría Principal)</option>
                {parentCategories.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Ícono */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Ícono Representativo
              </label>
              <select
                value={formIcon}
                onChange={e => setFormIcon(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="Sparkles">✨ Destellos (TCGs / Cartas)</option>
                <option value="Gamepad2">🎮 Control Gamer (Videojuegos)</option>
                <option value="ShieldCheck">🛡️ Escudo (Accesorios / Protección)</option>
                <option value="Package">📦 Caja / Paquete (General)</option>
                <option value="Layers">📑 Capas / Merchandising</option>
              </select>
            </div>

            {/* Color del Badge */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Color Identificador
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={formColor}
                  onChange={e => setFormColor(e.target.value)}
                  style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {formColor}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      )}

      {/* Árbol de Categorías */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Cargando estructura de categorías...
        </div>
      ) : parentCategories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          No hay categorías configuradas. Haz clic en "Restaurar Base" para inicializarlas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {parentCategories.map(parent => {
            const subs = getSubcategories(parent.id);
            const parentProductCount = countProducts(parent);

            return (
              <div
                key={parent.id}
                className="glass"
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(18, 22, 34, 0.65)'
                }}
              >
                {/* Cabecera de Categoría Principal */}
                <div style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: subs.length > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: `${parent.color || '#3b82f6'}20`,
                      border: `1.5px solid ${parent.color || '#3b82f6'}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {renderIcon(parent.icon, parent.color)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>
                          {parent.name}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          color: 'var(--text-secondary)'
                        }}>
                          slug: <code>{parent.slug}</code>
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {subs.length} subcategoría{subs.length !== 1 ? 's' : ''} · {parentProductCount} productos activos
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Categoría Principal */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleOpenAdd(parent.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Agregar subcategoría dentro de esta principal"
                    >
                      <FolderPlus size={13} color="#60a5fa" /> + Subcategoría
                    </button>
                    <button
                      onClick={() => handleOpenEdit(parent)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
                      title="Editar categoría"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(parent.id, parent.name)}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '6px' }}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Lista de Subcategorías Hijas */}
                {subs.length > 0 && (
                  <div style={{ padding: '12px 20px 16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {subs.map(sub => {
                      const subProductCount = countProducts(sub);
                      return (
                        <div
                          key={sub.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            backgroundColor: 'rgba(0, 0, 0, 0.25)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            marginLeft: '24px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Tag size={13} color={sub.color || '#94a3b8'} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                              {sub.name}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              ({subProductCount} items)
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenEdit(sub)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                              title="Editar subcategoría"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id, sub.name)}
                              style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px' }}
                              title="Eliminar subcategoría"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
