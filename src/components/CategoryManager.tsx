import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, FolderPlus, Sparkles, Gamepad2, ShieldCheck, 
  Package, Check, X, RefreshCw, Layers, Tag, Eye, EyeOff, LayoutGrid, Flame, Swords, Ship, Wand2
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
  initialTab?: 'tree' | 'content_bar';
}

export default function CategoryManager({ inventory, onCategoriesChanged, initialTab = 'tree' }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'content_bar'>(initialTab);
  
  // Modal / Form state for adding/editing
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formIcon, setFormIcon] = useState('Package');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formIsContentBar, setFormIsContentBar] = useState(true);
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
    setFormIsContentBar(true);
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
    setFormIsContentBar(cat.is_content_bar !== false);
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
          color: formColor,
          is_content_bar: formIsContentBar ? 1 : 0
        });
        setSuccessMsg(`Categoría "${formName}" actualizada exitosamente.`);
      } else {
        await apiCreateCategory({
          name: formName.trim(),
          parent_id: formParentId || null,
          icon: formIcon,
          color: formColor,
          is_content_bar: formIsContentBar ? 1 : 0
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

  const handleToggleContentBar = async (cat: CategoryItem) => {
    const nextVal = cat.is_content_bar === false ? 1 : 0;
    try {
      await apiUpdateCategory(cat.id, {
        is_content_bar: nextVal
      });
      await loadCategories();
      setSuccessMsg(`Visibilidad en Barra de Contenido actualizada para "${cat.name}".`);
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: any) {
      alert('Error al actualizar visibilidad: ' + err.message);
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
      case 'Flame': return <Flame size={16} color={color} />;
      case 'Swords': return <Swords size={16} color={color} />;
      case 'Ship': return <Ship size={16} color={color} />;
      case 'Wand2': return <Wand2 size={16} color={color} />;
      case 'Gamepad2': return <Gamepad2 size={16} color={color} />;
      case 'ShieldCheck': return <ShieldCheck size={16} color={color} />;
      case 'Layers': return <Layers size={16} color={color} />;
      case 'Tag': return <Tag size={16} color={color} />;
      default: return <Package size={16} color={color} />;
    }
  };

  const availableIcons = ['Sparkles', 'Flame', 'Swords', 'Ship', 'Wand2', 'Gamepad2', 'ShieldCheck', 'Package', 'Layers', 'Tag'];
  const availableColors = ['#ffcb05', '#f97316', '#ef4444', '#06b6d4', '#a855f7', '#10b981', '#3b82f6', '#ec4899'];

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
            📁 Gestor de Categorías & Barra de Contenido (TCGplayer Bar)
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Configura el árbol jerárquico de tu tienda y la barra horizontal superior para que tus clientes naveguen entre juegos (Pokémon, Magic, Yu-Gi-Oh, One Piece), videojuegos y coleccionables.
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
            <Plus size={16} /> Nueva Categoría
          </button>
        </div>
      </div>

      {/* Selector de Vistas: Árbol vs Barra de Contenido */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setActiveTab('tree')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'tree' ? '1px solid #3b82f6' : '1px solid transparent',
            backgroundColor: activeTab === 'tree' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'tree' ? '#93c5fd' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <LayoutGrid size={15} /> Árbol de Categorías & Subcategorías
        </button>

        <button
          onClick={() => setActiveTab('content_bar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'content_bar' ? '1px solid #ffcb05' : '1px solid transparent',
            backgroundColor: activeTab === 'content_bar' ? 'rgba(255, 203, 5, 0.15)' : 'transparent',
            color: activeTab === 'content_bar' ? '#ffcb05' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Layers size={15} /> 🎮 Barra de Contenido / Juegos (TCGplayer Bar)
        </button>
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

      {/* Formulario Modal / Inline para Crear o Editar */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="glass"
          style={{
            backgroundColor: '#121724',
            border: '1.5px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 800 }}>
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
            <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej. One Piece Card Game, Retro Gaming..."
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Jerarquía (Categoría Padre)
              </label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              >
                <option value="">(Ninguna - Será Categoría Principal)</option>
                {parentCategories.map(p => (
                  <option key={p.id} value={p.id} disabled={editingId === p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Ícono
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {availableIcons.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setFormIcon(ic)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: formIcon === ic ? '2px solid #ffcb05' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: formIcon === ic ? 'rgba(255,203,5,0.15)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {renderIcon(ic, formIcon === ic ? '#ffcb05' : 'rgba(255,255,255,0.7)')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Color Distintivo
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {availableColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: formColor === c ? '2px solid white' : 'none',
                      cursor: 'pointer',
                      boxShadow: formColor === c ? `0 0 8px ${c}` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Switch de Barra de Contenido */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong style={{ fontSize: '13px', color: '#fff', display: 'block' }}>
                Mostrar en Barra de Contenido (TCGplayer Bar)
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Si está activo, aparecerá en la barra horizontal superior para que los clientes puedan filtrar por este juego/sección directamente.
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formIsContentBar}
                onChange={(e) => setFormIsContentBar(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#ffcb05', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700, color: formIsContentBar ? '#ffcb05' : 'var(--text-secondary)' }}>
                {formIsContentBar ? 'Visible' : 'Oculto'}
              </span>
            </label>
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

      {/* VISTA 1: ÁRBOL DE CATEGORÍAS */}
      {activeTab === 'tree' && (
        <div>
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
                            {parent.is_content_bar !== false && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 203, 5, 0.15)',
                                color: '#ffcb05',
                                fontWeight: 800
                              }}>
                                🎮 EN BARRA
                              </span>
                            )}
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
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', padding: '6px 10px' }}
                          title="Añadir subcategoría"
                        >
                          <FolderPlus size={13} /> Añadir Subcategoría
                        </button>
                        <button
                          onClick={() => handleOpenEdit(parent)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e2e8f0',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px'
                          }}
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(parent.id, parent.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Eliminar categoría"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Lista de Subcategorías Hijas */}
                    {subs.length > 0 && (
                      <div style={{ padding: '8px 20px 14px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                        {subs.map(sub => {
                          const subProductCount = countProducts(sub);
                          return (
                            <div
                              key={sub.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '8px 12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <div style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  backgroundColor: `${sub.color || '#ffcb05'}15`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {renderIcon(sub.icon, sub.color)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {sub.name}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                    {subProductCount} productos · <code>{sub.slug}</code>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
                                <button
                                  onClick={() => handleToggleContentBar(sub)}
                                  title={sub.is_content_bar === false ? 'Mostrar en Barra de Contenido' : 'Ocultar de Barra de Contenido'}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: sub.is_content_bar === false ? 'rgba(255,255,255,0.3)' : '#ffcb05',
                                    cursor: 'pointer',
                                    padding: '4px'
                                  }}
                                >
                                  {sub.is_content_bar === false ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(sub)}
                                  style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: '4px' }}
                                  title="Editar subcategoría"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(sub.id, sub.name)}
                                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
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
      )}

      {/* VISTA 2: CONFIGURADOR DE LA BARRA DE CONTENIDO / JUEGOS */}
      {activeTab === 'content_bar' && (
        <div style={{
          backgroundColor: '#0c1017',
          border: '1px solid rgba(255, 203, 5, 0.25)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#ffcb05', fontWeight: 800 }}>
                🎮 Barra de Contenido / Juegos Activa en la Tienda
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Esta es la barra horizontal superior que ven todos tus compradores. Activa o desactiva qué juegos o secciones aparecen en la tienda.
              </p>
            </div>
            <button
              onClick={() => handleOpenAdd('')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
            >
              <Plus size={14} /> Agregar Juego / Sección
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {categories.map(cat => {
              const isVisible = cat.is_content_bar !== false;
              return (
                <div
                  key={cat.id}
                  style={{
                    backgroundColor: isVisible ? 'rgba(255, 203, 5, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: isVisible ? '1px solid rgba(255, 203, 5, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: `${cat.color || '#3b82f6'}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {renderIcon(cat.icon, cat.color)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                        slug: <code>{cat.slug}</code>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleContentBar(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: isVisible ? '1px solid #ffcb05' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: isVisible ? 'rgba(255, 203, 5, 0.15)' : 'transparent',
                      color: isVisible ? '#ffcb05' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {isVisible ? 'En Barra' : 'Oculto'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
