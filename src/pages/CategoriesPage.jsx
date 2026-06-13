import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, Edit3, Trash2, X, GripVertical,
  Check, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../api/client';

const DEFAULT_COLORS = [
  '#f5c518', '#3b82f6', '#22c55e', '#f97316', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f59e0b',
];

function CategoryCard({ category, index, color, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await onEdit(category._id, name);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color + '60';
        e.currentTarget.style.background = 'var(--bg-elevated)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <div style={{ color: 'var(--text-muted)', cursor: 'grab' }}>
        <GripVertical size={14} />
      </div>

      <div style={{
        width: 40, height: 40,
        background: color + '15',
        borderRadius: 'var(--radius)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Tag size={17} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              disabled={saving}
              style={{ fontSize: 13, padding: '4px 8px', height: 32, flex: 1 }}
            />
            <button onClick={handleSave} disabled={saving} style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
            }}>
              <Check size={13} />
            </button>
            <button onClick={() => { setIsEditing(false); setEditName(category.name); }} style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {category.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Slug: {category.slug} · {category.isActive ? 'Active' : 'Inactive'}
            </div>
          </>
        )}
      </div>

      {!isEditing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(category._id)}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminGetCategories();
      setCategories(res?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setAdding(true);
    setError('');
    try {
      const res = await adminCreateCategory({ name });
      setCategories(prev => [...prev, res.data]);
      setNewCategory('');
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id, name) => {
    const res = await adminUpdateCategory(id, { name });
    setCategories(prev => prev.map(c => (c._id === id ? res.data : c)));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await adminDeleteCategory(id);
      setCategories(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const activeCount = categories.filter(c => c.isActive !== false).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading categories...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            letterSpacing: '0.06em', marginBottom: 4,
            color: 'var(--text-primary)',
          }}>
            CATEGORIES <span style={{ color: 'var(--accent)' }}>MANAGEMENT</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Categories synced with the database — used on homepage and browse
          </p>
        </div>
        <button
          onClick={fetchCategories}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', marginBottom: 16,
          background: 'var(--red-dim)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius)',
          fontSize: 12, color: 'var(--red)',
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Total Categories', value: categories.length, color: 'var(--accent)' },
          { label: 'Active', value: activeCount, color: 'var(--green)' },
          { label: 'Inactive', value: categories.length - activeCount, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Enter new category name..."
          style={{ flex: 1, height: 40, fontSize: 13 }}
        />
        <button
          onClick={handleAdd}
          disabled={!newCategory.trim() || adding}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: newCategory.trim() && !adding ? 'var(--accent)' : 'var(--bg-elevated)',
            color: newCategory.trim() && !adding ? '#000' : 'var(--text-muted)',
            borderRadius: 'var(--radius)',
            fontSize: 12, fontWeight: 700,
            border: 'none',
            cursor: newCategory.trim() && !adding ? 'pointer' : 'not-allowed',
            opacity: newCategory.trim() && !adding ? 1 : 0.5,
          }}
        >
          <Plus size={14} /> {adding ? 'Adding...' : 'Add Category'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            No categories yet. Add one above or run the database seed.
          </p>
        ) : (
          categories.map((cat, index) => (
            <CategoryCard
              key={cat._id}
              category={cat}
              index={index}
              color={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
