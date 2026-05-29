import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, AlertTriangle, Film, Tv, Play, List } from 'lucide-react';
import { Badge, Btn, DropZone, Toggle, Card, FormRow, Field } from '../components/admin/ui';
import {
  getSeries, getSeriesById, createSeries, updateSeries, deleteSeries,
  getSeasons, createSeason, getSeasonById, updateSeason, deleteSeason,
  getEpisodes, createEpisode, getEpisodeById, updateEpisode, deleteEpisode,
  getMovies, getMovieById, createMovie, updateMovie, deleteMovie,
} from '../lib/api/cms';

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, title, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: width,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.08em' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '20px 22px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM DELETE MODAL ──────────────────────────────────────────────────────
function DeleteModal({ open, onClose, onConfirm, itemName, itemType }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--red)',
        borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 420,
        padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: 'var(--red-dim)',
            border: '1px solid rgba(239,68,68,0.25)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} color="var(--red)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Delete {itemType}?</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"{itemName}"</span>? This action cannot be undone.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm}><Trash2 size={13} /> Delete</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
function Table({ columns, rows, emptyMsg }) {
  return (
    <div className="table-scroll-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ minWidth: 700, display: 'grid', gridTemplateColumns: columns.map(c => c.width || '1fr').join(' '),
        background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px', gap: 8,
      }}>
        {columns.map(c => (
          <div key={c.key} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 13 }}>{emptyMsg}</div>
      ) : (
        rows.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: columns.map(c => c.width || '1fr').join(' '),
            padding: '12px 16px', gap: 8, alignItems: 'center',
            borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
            background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)'}
          >
            {columns.map(c => (
              <div key={c.key} style={{ fontSize: 13, overflow: 'hidden' }}>{row[c.key]}</div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

// ─── SEARCH + ACTION BAR ──────────────────────────────────────────────────────
function ListBar({ search, onSearch, onAdd, addLabel, count, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{count}</span> {label}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 240, minWidth: 120 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder={`Search ${label}...`}
            style={{ paddingLeft: 30, paddingRight: search ? 28 : 12, height: 34, fontSize: 12 }} />
          {search && (
            <button onClick={() => onSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
              <X size={12} />
            </button>
          )}
        </div>
        <Btn variant="primary" size="sm" onClick={onAdd}><Plus size={13} /> {addLabel}</Btn>
      </div>
    </div>
  );
}

// ─── GENRES ──────────────────────────────────────────────────────────────────
const GENRES = ['Action', 'Comedy', 'Crime', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation'];
const STATUSES = ['Published', 'Draft', 'Archived'];

// ─── SERIES FORM ──────────────────────────────────────────────────────────────
function SeriesForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    title: '', releaseYear: new Date().getFullYear(), description: '',
    genre: '', tags: [], premium: false, status: 'Draft',
  });
  const [tagInput, setTagInput] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Series Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormRow>
            <Field label="Series Title" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enter series title..." />
            </Field>
            <Field label="Release Year" required>
              <input type="number" value={form.releaseYear} onChange={e => set('releaseYear', e.target.value)} min="1900" max="2030" style={{ width: 110 }} />
            </Field>
          </FormRow>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Enter series description..." rows={3} style={{ resize: 'vertical' }} />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>{form.description.length}/500</div>
          </Field>
          <FormRow>
            <Field label="Genre" required>
              <select value={form.genre} onChange={e => set('genre', e.target.value)}>
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Tags">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px', minHeight: 38 }}>
              {form.tags.map(t => (
                <span key={t} style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {t}<X size={9} style={{ cursor: 'pointer' }} onClick={() => set('tags', form.tags.filter(x => x !== t))} />
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput(''); e.preventDefault(); } }}
                placeholder="Add tag, press Enter..." style={{ border: 'none', background: 'none', padding: 0, width: 140, fontSize: 12 }} />
            </div>
          </Field>
          <Toggle checked={form.premium} onChange={v => set('premium', v)} label="Premium Series" sub="Only premium users can watch" />
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        {onCancel && <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>}
        <Btn variant="primary" onClick={() => onSave(form)}>
          <Check size={14} /> {initial ? 'Save Changes' : 'Create Series'}
        </Btn>
      </div>
    </div>
  );
}

// ─── SEASON FORM ──────────────────────────────────────────────────────────────
function SeasonForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    seriesId: '', title: '', releaseYear: new Date().getFullYear(), description: '', status: 'Draft',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Season Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Series" required>
            <select value={form.seriesId} onChange={e => set('seriesId', e.target.value)} disabled={!!initial}>
              <option value="">Select series</option>
            </select>
          </Field>
          <FormRow>
            <Field label="Season Title" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Season 1" />
            </Field>
            <Field label="Release Year">
              <input type="number" value={form.releaseYear} onChange={e => set('releaseYear', e.target.value)} min="1900" max="2030" />
            </Field>
          </FormRow>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Season description..." rows={2} style={{ resize: 'none' }} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>}
        <Btn variant="primary" onClick={() => onSave(form)}>
          <Check size={14} /> {initial ? 'Save Changes' : 'Create Season'}
        </Btn>
      </div>
    </div>
  );
}

// ─── EPISODE FORM ─────────────────────────────────────────────────────────────
function EpisodeForm({ initial, onSave, onCancel, seriesId: contextSeriesId, seasonId: contextSeasonId }) {
  const [form, setForm] = useState(initial || {
    seriesId: contextSeriesId || '', seasonId: contextSeasonId || '', title: '', number: 1, duration: '', description: '', status: 'Draft',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Episode Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormRow>
            <Field label="Series" required>
              <input value={form.seriesId} disabled style={{ opacity: 0.6 }} />
            </Field>
            <Field label="Season" required>
              <input value={form.seasonId} disabled style={{ opacity: 0.6 }} />
            </Field>
          </FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8 }}>
            <Field label="Episode Title" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Episode title" />
            </Field>
            <Field label="Ep. #">
              <input type="number" value={form.number} onChange={e => set('number', e.target.value)} min="1" />
            </Field>
            <Field label="Duration (min)">
              <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="58" />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Episode description..." rows={2} style={{ resize: 'none' }} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>}
        <Btn variant="primary" onClick={() => onSave(form)}>
          <Check size={14} /> {initial ? 'Save Changes' : 'Create Episode'}
        </Btn>
      </div>
    </div>
  );
}

// ─── MOVIE FORM ───────────────────────────────────────────────────────────────
function MovieForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    title: '', releaseYear: new Date().getFullYear(), description: '',
    genre: '', director: '', duration: '', tags: [], premium: false, status: 'Draft',
  });
  const [tagInput, setTagInput] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Movie Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormRow>
            <Field label="Movie Title" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enter movie title..." />
            </Field>
            <Field label="Release Year" required>
              <input type="number" value={form.releaseYear} onChange={e => set('releaseYear', e.target.value)} min="1900" max="2030" style={{ width: 110 }} />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Director">
              <input value={form.director} onChange={e => set('director', e.target.value)} placeholder="Director name..." />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="120" />
            </Field>
          </FormRow>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Enter movie description..." rows={3} style={{ resize: 'vertical' }} />
          </Field>
          <FormRow>
            <Field label="Genre" required>
              <select value={form.genre} onChange={e => set('genre', e.target.value)}>
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Tags">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px', minHeight: 38 }}>
              {form.tags.map(t => (
                <span key={t} style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {t}<X size={9} style={{ cursor: 'pointer' }} onClick={() => set('tags', form.tags.filter(x => x !== t))} />
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput(''); e.preventDefault(); } }}
                placeholder="Add tag, press Enter..." style={{ border: 'none', background: 'none', padding: 0, width: 140, fontSize: 12 }} />
            </div>
          </Field>
          <Toggle checked={form.premium} onChange={v => set('premium', v)} label="Premium Movie" sub="Only premium users can watch" />
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        {onCancel && <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>}
        <Btn variant="primary" onClick={() => onSave(form)}>
          <Check size={14} /> {initial ? 'Save Changes' : 'Add Movie'}
        </Btn>
      </div>
    </div>
  );
}

// ─── ACTION CELL ──────────────────────────────────────────────────────────────
function Actions({ onEdit, onDelete, onView }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {onView && <Btn variant="ghost" size="sm" onClick={onView} style={{ padding: '4px 8px' }}><List size={12} /></Btn>}
      <Btn variant="ghost" size="sm" onClick={onEdit} style={{ padding: '4px 8px' }}><Edit2 size={12} /></Btn>
      <Btn variant="ghost" size="sm" onClick={onDelete} style={{ padding: '4px 8px', color: 'var(--red)' }}><Trash2 size={12} /></Btn>
    </div>
  );
}

// ─── SERIES TAB ───────────────────────────────────────────────────────────────
function SeriesTab({ seriesList, onRefresh }) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() =>
    seriesList.filter(s =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(s.genre) ? s.genre.join(' ') : s.genre || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.status || '').toLowerCase().includes(search.toLowerCase())
    ), [seriesList, search]);

  const handleSave = async (form) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('release_year', String(form.releaseYear));
      fd.append('description', form.description || '');
      fd.append('genre_ids', form.genre || '');
      fd.append('tags', (form.tags || []).join(','));
      fd.append('is_premium', form.premium ? 'true' : 'false');
      fd.append('status', (form.status || 'Draft').toLowerCase());

      const seriesId = form.id || form._id || modal?.item?.id || modal?.item?._id;

      if (modal?.mode === 'edit' && seriesId) {
        await updateSeries(seriesId, fd);
      } else {
        await createSeries(fd);
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      console.error('Series save error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteSeries(deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      console.error('Series delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', width: '2fr' },
    { key: 'genre', label: 'Genre', width: '1fr' },
    { key: 'year', label: 'Year', width: '70px' },
    { key: 'seasons', label: 'Seasons', width: '80px' },
    { key: 'status', label: 'Status', width: '110px' },
    { key: 'actions', label: 'Actions', width: '90px' },
  ];

  const rows = filtered.map(s => ({
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Tv size={14} color="var(--text-muted)" />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</div>
          {s.premium && <span style={{ fontSize: 10, background: 'rgba(245,197,24,0.15)', color: 'var(--accent)', padding: '0 5px', borderRadius: 3, fontWeight: 700 }}>PRO</span>}
        </div>
      </div>
    ),
    genre: <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{Array.isArray(s.genre) ? s.genre.join(', ') : s.genre || '—'}</span>,
    year: <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.releaseYear || s.year || '—'}</span>,
    seasons: <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.seasonCount || s.seasons || 0}</span>,
    status: <Badge status={s.status === 'published' ? 'Published' : s.status === 'draft' ? 'Draft' : 'Archived'} />,
    actions: <Actions
      onView={() => setModal({ mode: 'manage', item: s })}
      onEdit={() => setModal({ mode: 'edit', item: { ...s, releaseYear: s.releaseYear || s.year } })}
      onDelete={() => setDeleteTarget(s)}
    />,
  }));

  return (
    <div>
      <ListBar search={search} onSearch={setSearch} onAdd={() => setModal({ mode: 'add', item: null })} addLabel="Add Series" count={filtered.length} label="series" />
      <Table columns={columns} rows={rows} emptyMsg={search ? `No series matching "${search}"` : 'No series yet. Add your first series!'} />

      <Modal open={modal?.mode === 'manage'} onClose={() => setModal(null)} title={`MANAGE: ${modal?.item?.title || ''}`} width={700}>
        {modal?.item && <SeriesDetailView seriesId={modal.item.id} onBack={() => setModal(null)} />}
      </Modal>

      <Modal open={modal?.mode === 'add' || modal?.mode === 'edit'} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'EDIT SERIES' : 'ADD NEW SERIES'} width={580}>
        <SeriesForm
          initial={modal?.mode === 'edit' ? modal.item : null}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title} itemType="Series" />
    </div>
  );
}

// ─── SERIES DETAIL VIEW (Seasons & Episodes) ───────────────────────────────
function SeriesDetailView({ seriesId, onBack }) {
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodesBySeason, setEpisodesBySeason] = useState({});
  const [expandedSeason, setExpandedSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasonModal, setSeasonModal] = useState(null);
  const [episodeModal, setEpisodeModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('');

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSeriesById(seriesId);
      const data = res.data;
      setSeries(data);
      const seasonsData = data.seasons || [];
      setSeasons(seasonsData);

      const epMap = {};
      for (const season of seasonsData) {
        epMap[season._id || season.id] = season.episodes || [];
      }
      setEpisodesBySeason(epMap);
    } catch (err) {
      console.error('Fetch series detail error:', err);
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // Count all episodes
  const totalEpisodes = Object.values(episodesBySeason).reduce((acc, eps) => acc + eps.length, 0);

  const handleSaveSeason = async (form) => {
    try {
      const payload = {
        title: form.title,
        release_year: parseInt(form.releaseYear),
        description: form.description || '',
        status: (form.status || 'Draft').toLowerCase(),
      };

      if (seasonModal?.mode === 'edit') {
        await updateSeason(seriesId, form.id, payload);
      } else {
        await createSeason(seriesId, { ...payload, seriesId });
      }
      setSeasonModal(null);
      fetchSeries();
    } catch (err) {
      console.error('Season save error:', err);
      alert(err.message);
    }
  };

  const handleSaveEpisode = async (form) => {
    try {
      const targetSeasonId = form.seasonId || seasonModal?.seasonId;

      if (!targetSeasonId && form.seasonId) {
        // need to determine the seasonId
      }

      if (episodeModal?.mode === 'edit') {
        await updateEpisode(form.id, {
          title: form.title,
          episode_number: parseInt(form.number),
          duration_minutes: parseInt(form.duration) || 0,
          description: form.description || '',
          status: (form.status || 'Draft').toLowerCase(),
        });
      } else {
        if (!targetSeasonId) return alert('Season ID is required');
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('episode_number', String(parseInt(form.number) || 1));
        formData.append('duration_minutes', String(parseInt(form.duration) || 0));
        formData.append('description', form.description || '');
        formData.append('status', (form.status || 'Draft').toLowerCase());
        await createEpisode(seriesId, targetSeasonId, formData);
      }
      setEpisodeModal(null);
      fetchSeries();
    } catch (err) {
      console.error('Episode save error:', err);
      alert(err.message);
    }
  };

  const handleDeleteSeason = async () => {
    try {
      await deleteSeason(seriesId, deleteTarget.id);
      setDeleteTarget(null);
      fetchSeries();
    } catch (err) {
      console.error('Delete season error:', err);
    }
  };

  const handleDeleteEpisode = async () => {
    try {
      await deleteEpisode(deleteTarget.id);
      setDeleteTarget(null);
      fetchSeries();
    } catch (err) {
      console.error('Delete episode error:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading series details...</div>;
  }

  if (!series) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Series not found.</div>;
  }

  return (
    <div>
      {/* Series header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          Series
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{series.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {seasons.length} seasons · {totalEpisodes} episodes
          {series.genre && <span> · {Array.isArray(series.genre) ? series.genre.join(', ') : series.genre}</span>}
        </div>
      </div>

      {/* Seasons list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {seasons.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
            No seasons yet. Add the first season!
          </div>
        )}

        {seasons.map(season => {
          const seasonId = season._id || season.id;
          const eps = episodesBySeason[seasonId] || [];
          const isExpanded = expandedSeason === seasonId;

          return (
            <Card key={seasonId} style={{ overflow: 'hidden' }}>
              <div
                onClick={() => setExpandedSeason(isExpanded ? null : seasonId)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', cursor: 'pointer',
                  background: isExpanded ? 'var(--bg-elevated)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: 'var(--accent-subtle)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                  }}>{season.order || season.seasonNumber || seasons.indexOf(season) + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{season.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{eps.length} episodes · {season.releaseYear || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge status={season.status === 'published' ? 'Published' : season.status === 'draft' ? 'Draft' : 'Archived'} />
                  <Btn variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSeasonModal({ mode: 'edit', item: { ...season, seasonId, seriesId }, seasonId }); }}>
                    <Edit2 size={11} />
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(season); setDeleteType('season'); }} style={{ color: 'var(--red)' }}>
                    <Trash2 size={11} />
                  </Btn>
                </div>
              </div>

              {/* Episodes under this season */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px' }}>
                  {eps.length === 0 ? (
                    <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      No episodes yet.
                    </div>
                  ) : (
                    eps.map((ep, idx) => (
                      <div key={ep._id || ep.id || idx} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 0', borderBottom: idx < eps.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                        }}>{ep.episodeNumber || ep.number || idx + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{ep.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {ep.durationMinutes || ep.duration ? `${ep.durationMinutes || ep.duration}m` : '—'}
                          </div>
                        </div>
                        <Badge status={ep.status === 'published' ? 'Published' : ep.status === 'draft' ? 'Draft' : 'Archived'} />
                        <Btn variant="ghost" size="sm" onClick={() => setEpisodeModal({ mode: 'edit', item: { ...ep, id: ep._id || ep.id, seriesId, seasonId } })}>
                          <Edit2 size={11} />
                        </Btn>
                        <Btn variant="ghost" size="sm" onClick={() => { setDeleteTarget(ep); setDeleteType('episode'); }} style={{ color: 'var(--red)' }}>
                          <Trash2 size={11} />
                        </Btn>
                      </div>
                    ))
                  )}

                  <div style={{ padding: '8px 0' }}>
                    <Btn variant="outline" size="sm" onClick={() => setEpisodeModal({ mode: 'add', seasonId, seriesId })}>
                      <Plus size={11} /> Add Episode
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <Btn variant="secondary" size="sm" onClick={() => setSeasonModal({ mode: 'add', seriesId })}>
          <Plus size={13} /> Add Season
        </Btn>
      </div>

      {/* Season Modal */}
      <Modal open={!!seasonModal} onClose={() => setSeasonModal(null)} title={seasonModal?.mode === 'edit' ? 'EDIT SEASON' : 'ADD NEW SEASON'} width={520}>
        <SeasonForm
          initial={seasonModal?.mode === 'edit' ? seasonModal.item : null}
          onSave={handleSaveSeason}
          onCancel={() => setSeasonModal(null)}
        />
      </Modal>

      {/* Episode Modal */}
      <Modal open={!!episodeModal} onClose={() => setEpisodeModal(null)} title={episodeModal?.mode === 'edit' ? 'EDIT EPISODE' : 'ADD NEW EPISODE'} width={520}>
        <EpisodeForm
          initial={episodeModal?.mode === 'edit' ? episodeModal.item : null}
          onSave={handleSaveEpisode}
          onCancel={() => setEpisodeModal(null)}
          seriesId={episodeModal?.seriesId || seriesId}
          seasonId={episodeModal?.seasonId}
        />
      </Modal>

      {/* Delete Modal */}
      <DeleteModal
        open={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteType(''); }}
        onConfirm={deleteType === 'season' ? handleDeleteSeason : handleDeleteEpisode}
        itemName={deleteTarget?.title}
        itemType={deleteType === 'season' ? 'Season' : 'Episode'}
      />
    </div>
  );
}

// ─── MOVIES TAB ───────────────────────────────────────────────────────────────
function MoviesTab({ moviesList, onRefresh }) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() =>
    moviesList.filter(m =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      (m.genre || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.director || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.status || '').toLowerCase().includes(search.toLowerCase())
    ), [moviesList, search]);

  const handleSave = async (form) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('release_year', String(form.releaseYear));
      fd.append('duration_minutes', String(parseInt(form.duration, 10) || 0));
      fd.append('description', form.description || '');
      fd.append('genre_ids', form.genre || '');
      fd.append('tags', (form.tags || []).join(','));
      fd.append('director', form.director || '');
      fd.append('is_premium', form.premium ? 'true' : 'false');
      fd.append('status', (form.status || 'Draft').toLowerCase());

      const movieId = form.id || form._id || modal?.item?.id || modal?.item?._id;

      if (modal?.mode === 'edit' && movieId) {
        await updateMovie(movieId, fd);
      } else {
        await createMovie(fd);
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      console.error('Movie save error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMovie(deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      console.error('Movie delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', width: '2fr' },
    { key: 'genre', label: 'Genre', width: '1fr' },
    { key: 'year', label: 'Year', width: '70px' },
    { key: 'director', label: 'Director', width: '1.5fr' },
    { key: 'duration', label: 'Duration', width: '80px' },
    { key: 'status', label: 'Status', width: '110px' },
    { key: 'actions', label: 'Actions', width: '90px' },
  ];

  const rows = filtered.map(m => ({
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 44, borderRadius: 6, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Film size={14} color="var(--text-muted)" />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</div>
          {m.premium && <span style={{ fontSize: 10, background: 'rgba(245,197,24,0.15)', color: 'var(--accent)', padding: '0 5px', borderRadius: 3, fontWeight: 700 }}>PRO</span>}
        </div>
      </div>
    ),
    genre: <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{Array.isArray(m.genre) ? m.genre.join(', ') : m.genre || '—'}</span>,
    year: <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.releaseYear || m.year || '—'}</span>,
    director: <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.director || '—'}</span>,
    duration: <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.durationMinutes || m.duration ? `${m.durationMinutes || m.duration}m` : '—'}</span>,
    status: <Badge status={m.status === 'published' ? 'Published' : m.status === 'draft' ? 'Draft' : 'Archived'} />,
    actions: <Actions onEdit={() => setModal({ mode: 'edit', item: { ...m, releaseYear: m.releaseYear || m.year } })} onDelete={() => setDeleteTarget(m)} />,
  }));

  return (
    <div>
      <ListBar search={search} onSearch={setSearch} onAdd={() => setModal({ mode: 'add', item: null })} addLabel="Add Movie" count={filtered.length} label="movies" />
      <Table columns={columns} rows={rows} emptyMsg={search ? `No movies matching "${search}"` : 'No movies yet. Add your first movie!'} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'EDIT MOVIE' : 'ADD NEW MOVIE'} width={580}>
        <MovieForm initial={modal?.item} onSave={handleSave} onCancel={() => setModal(null)} />
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title} itemType="Movie" />
    </div>
  );
}

// ─── TAB BUTTON ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 18px', borderRadius: 'var(--radius)',
      background: active ? 'var(--accent)' : 'var(--bg-card)',
      color: active ? '#000' : 'var(--text-secondary)',
      border: active ? 'none' : '1px solid var(--border)',
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
      transition: 'all 0.18s ease',
    }}>
      <Icon size={15} />
      {label}
      <span style={{
        background: active ? 'rgba(0,0,0,0.18)' : 'var(--bg-elevated)',
        color: active ? '#000' : 'var(--text-muted)',
        borderRadius: 99, fontSize: 11, fontWeight: 800,
        padding: '1px 7px', fontFamily: 'var(--font-mono)',
      }}>{count}</span>
    </button>
  );
}

// ─── MAIN CONTENT PAGE ────────────────────────────────────────────────────────
export default function ContentPage() {
  const [tab, setTab] = useState('series');
  const [seriesList, setSeriesList] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [seriesRes, moviesRes] = await Promise.allSettled([
        getSeries({ limit: 100 }),
        getMovies({ limit: 100 }),
      ]);

      if (seriesRes.status === 'fulfilled') {
        setSeriesList(seriesRes.value?.data || []);
      }
      if (moviesRes.status === 'fulfilled') {
        setMoviesList(moviesRes.value?.data || []);
      }
    } catch (err) {
      console.error('Content fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalSeasons = seriesList.reduce((acc, s) => acc + (s.seasonCount || s.seasons || 0), 0);
  const totalEpisodes = seriesList.reduce((acc, s) => acc + (s.episodeCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.08em', marginBottom: 4 }}>
          CONTENT <span style={{ color: 'var(--accent)' }}>MANAGEMENT</span>
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage all your series, seasons, episodes and movies.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'series'} onClick={() => setTab('series')} icon={Tv} label="Series" count={seriesList.length} />
        <TabBtn active={tab === 'movies'} onClick={() => setTab('movies')} icon={Film} label="Movies" count={moviesList.length} />
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading content...</div>
        ) : (
          <>
            {tab === 'series' && <SeriesTab seriesList={seriesList} onRefresh={fetchAll} />}
            {tab === 'movies' && <MoviesTab moviesList={moviesList} onRefresh={fetchAll} />}
          </>
        )}
      </div>
    </div>
  );
}