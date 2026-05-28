import React, { useState } from 'react';
import {
  Tag, Plus, Edit3, Trash2, Save, X, GripVertical,
  Film, Tv, Sparkles, Check
} from 'lucide-react';
import { OTT_CATEGORIES } from '../data/categories';

const DEFAULT_COLORS = [
  '#f5c518', '#3b82f6', '#22c55e', '#f97316', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f59e0b',
];

function CategoryCard({ category, index, color, onEdit, onDelete, onToggle }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category);

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(index, editName.trim());
      setIsEditing(false);
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
              style={{ fontSize: 13, padding: '4px 8px', height: 32, flex: 1 }}
            />
            <button onClick={handleSave} style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
            }}>
              <Check size={13} />
            </button>
            <button onClick={() => { setIsEditing(false); setEditName(category); }} style={{
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
              {category}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Slug: {category.toLowerCase().replace(/\s+/g, '-')}
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
              border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(index)}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState(OTT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [saved, setSaved] = useState(false);

  const handleAdd = () => {
    const name = newCategory.trim();
    if (name && !categories.includes(name)) {
      setCategories([...categories, name]);
      setNewCategory('');
    }
  };

  const handleEdit = (index, newName) => {
    const updated = [...categories];
    updated[index] = newName;
    setCategories(updated);
  };

  const handleDelete = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            letterSpacing: '0.06em', marginBottom: 4,
          }}>
            CATEGORIES <span style={{ color: 'var(--accent)' }}>MANAGEMENT</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Organize your content with genres and categories
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: saved ? 'var(--green)' : 'var(--accent)',
            color: '#000',
            borderRadius: 'var(--radius)',
            fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Total Categories', value: categories.length, color: 'var(--accent)' },
          { label: 'Active', value: categories.length, color: 'var(--green)' },
          { label: 'Content Coverage', value: '100%', color: '#3b82f6' },
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

      {/* Add new category */}
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
          disabled={!newCategory.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: newCategory.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            color: newCategory.trim() ? '#000' : 'var(--text-muted)',
            borderRadius: 'var(--radius)',
            fontSize: 12, fontWeight: 700,
            border: 'none',
            cursor: newCategory.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            opacity: newCategory.trim() ? 1 : 0.5,
          }}
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Category list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.map((cat, index) => (
          <CategoryCard
            key={cat}
            category={cat}
            index={index}
            color={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}