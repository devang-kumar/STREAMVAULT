import React from 'react';

export function Badge({ status }) {
  const map = {
    Published: { bg: 'var(--green-dim)', color: 'var(--green)', label: 'Published' },
    published: { bg: 'var(--green-dim)', color: 'var(--green)', label: 'Published' },
    Draft: { bg: 'rgba(245,197,24,0.12)', color: 'var(--accent)', label: 'Draft' },
    draft: { bg: 'rgba(245,197,24,0.12)', color: 'var(--accent)', label: 'Draft' },
    Archived: { bg: 'var(--red-dim)', color: 'var(--red)', label: 'Archived' },
    archived: { bg: 'var(--red-dim)', color: 'var(--red)', label: 'Archived' },
  };
  const s = map[status] || map.Draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', onClick, style: sx, disabled, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'var(--font-body)', fontWeight: 600,
    borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition)',
    border: 'none',
    whiteSpace: 'nowrap',
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '5px 10px' : size === 'lg' ? '10px 20px' : '8px 14px',
  };
  const variants = {
    primary: { background: 'var(--accent)', color: '#000' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    ghost: { background: 'none', color: 'var(--text-secondary)' },
    danger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' },
    outline: { background: 'none', color: 'var(--accent)', border: '1px solid var(--accent)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...sx }}>
      {children}
    </button>
  );
}

export function DropZone({ label, subLabel, accept, height = 120, preview, onClear, small }) {
  return (
    <div style={{
      border: '1.5px dashed var(--border-light)',
      borderRadius: 'var(--radius)',
      height, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 6,
      background: 'var(--bg-input)', cursor: 'pointer', position: 'relative',
      transition: 'border-color var(--transition)',
    }}>
      {preview ? (
        <>
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
          {onClear && (
            <button onClick={onClear} style={{
              position: 'absolute', top: 6, right: 6,
              background: 'var(--red)', color: '#fff',
              border: 'none', borderRadius: '50%', width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, cursor: 'pointer',
            }}>×</button>
          )}
        </>
      ) : (
        <>
          <div style={{ color: 'var(--text-muted)', fontSize: 22 }}>⊞</div>
          {small ? (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
              Drag & drop or <span style={{ color: 'var(--accent)' }}>browse</span>
            </span>
          ) : (
            <>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Drag & drop <b>{label}</b><br />or click to <span style={{ color: 'var(--accent)' }}>browse</span>
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{subLabel}</span>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 99,
          background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          cursor: 'pointer', transition: 'background 0.2s',
          position: 'relative', flexShrink: 0,
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#000' : 'var(--text-muted)',
          position: 'absolute', top: 2,
          left: checked ? 20 : 2,
          transition: 'left 0.2s',
        }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

export function Card({ children, style: sx }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      ...sx,
    }}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle, number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
      {number && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--accent)', color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, flexShrink: 0, marginTop: 2,
        }}>{number}</div>
      )}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

export function FormRow({ children, cols = 2 }) {
  return (
    <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {children}
      <style>{`
        @media (max-width: 640px) {
          .admin-form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export function Field({ label, required, children }) {
  return (
    <div>
      <label>{label}{required && <span className="req">*</span>}</label>
      {children}
    </div>
  );
}