import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, X, Check, AlertTriangle, Film, Tv, Play, List, Image, ExternalLink } from 'lucide-react';
import { Badge, Btn, Toggle, Card, FormRow, Field } from '../components/admin/ui';
import FileDropzone from '../components/cms/FileDropzone';
import {
  getSeries, getSeriesById, createSeries, updateSeries, deleteSeries,
  getSeasons, createSeason, getSeasonById, updateSeason, deleteSeason,
  getEpisodes, createEpisode, getEpisodeById, updateEpisode, deleteEpisode,
  getMovies, getMovieById, createMovie, updateMovie, deleteMovie,
} from '../lib/api/cms';
import { adminUploadImage, adminUploadVideo } from '../api/client';

// ─── DEVELOPMENT FLAGS ─────────────────────────────────────────────────────────
const USE_MOCK_CONTENT = true;   // Enable mock data fallbacks
const CMS_DEV_MODE = true;       // Enable debug logging & graceful failure handling

// ─── CMS MOCK DATA (matches expected API shape) ───────────────────────────────
const MOCK_SERIES = [
  {
    _id: "mock-s1", id: "mock-s1", title: "Dark Horizons",
    description: "A gripping thriller that follows a detective unraveling a decades-old conspiracy in a rain-soaked megacity.",
    genre: ["Thriller"], releaseYear: 2024, year: 2024, status: "published", premium: false,
    thumbnail: "", banner: "", poster: "", trailerUrl: "",
    seasonCount: 2,
    seasons: [
      { _id: "mock-s1-season1", id: "mock-s1-season1", title: "Season 1", releaseYear: 2024, status: "published", description: "The opening chapter.", order: 1, episodes: [
        { _id: "mock-s1-s1-e1", id: "mock-s1-s1-e1", title: "Pilot", episodeNumber: 1, durationMinutes: 52, status: "published", description: "The case begins.", thumbnail: "" },
        { _id: "mock-s1-s1-e2", id: "mock-s1-s1-e2", title: "The Signal", episodeNumber: 2, durationMinutes: 48, status: "published", description: "A mysterious transmission.", thumbnail: "" },
      ]},
      { _id: "mock-s1-season2", id: "mock-s1-season2", title: "Season 2", releaseYear: 2024, status: "draft", description: "The conspiracy deepens.", order: 2, episodes: [] },
    ],
  },
  {
    _id: "mock-s2", id: "mock-s2", title: "Neon Requiem",
    description: "A cyberpunk action series set in a neon-lit dystopia where rebels fight against corporate overlords.",
    genre: ["Action"], releaseYear: 2024, year: 2024, status: "published", premium: true,
    thumbnail: "", banner: "", poster: "", trailerUrl: "",
    seasonCount: 1,
    seasons: [
      { _id: "mock-s2-season1", id: "mock-s2-season1", title: "Season 1", releaseYear: 2024, status: "published", description: "Enter the neon underworld.", order: 1, episodes: [
        { _id: "mock-s2-s1-e1", id: "mock-s2-s1-e1", title: "Jack In", episodeNumber: 1, durationMinutes: 58, status: "published", description: "A hacker's awakening.", thumbnail: "" },
      ]},
    ],
  },
  {
    _id: "mock-s3", id: "mock-s3", title: "The Quiet Algorithm",
    description: "A sci-fi drama exploring what happens when an AI begins to dream — and what it dreams about.",
    genre: ["Sci-Fi"], releaseYear: 2023, year: 2023, status: "published", premium: false,
    thumbnail: "", banner: "", poster: "", trailerUrl: "",
    seasonCount: 3,
    seasons: [
      { _id: "mock-s3-season1", id: "mock-s3-season1", title: "Season 1", releaseYear: 2023, status: "published", description: "Genesis.", order: 1, episodes: [
        { _id: "mock-s3-s1-e1", id: "mock-s3-s1-e1", title: "First Dream", episodeNumber: 1, durationMinutes: 60, status: "published", description: "", thumbnail: "" },
      ]},
      { _id: "mock-s3-season2", id: "mock-s3-season2", title: "Season 2", releaseYear: 2023, status: "published", description: "Awakening.", order: 2, episodes: [] },
      { _id: "mock-s3-season3", id: "mock-s3-season3", title: "Season 3", releaseYear: 2024, status: "draft", description: "Convergence.", order: 3, episodes: [] },
    ],
  },
  {
    _id: "mock-s4", id: "mock-s4", title: "Saltwater Empire",
    description: "A sweeping family drama set across three generations of a powerful fishing dynasty.",
    genre: ["Drama"], releaseYear: 2024, year: 2024, status: "draft", premium: false,
    thumbnail: "", banner: "", poster: "", trailerUrl: "",
    seasonCount: 0,
    seasons: [],
  },
];

const MOCK_MOVIES = [
  { _id: "mock-m1", id: "mock-m1", title: "Echoes of Tomorrow", description: "A time-travel thriller.", genre: ["Sci-Fi", "Thriller"], releaseYear: 2024, year: 2024, status: "published", premium: false, durationMinutes: 124, director: "A. Reyes", thumbnail: "", poster: "", banner: "", trailerUrl: "" },
  { _id: "mock-m2", id: "mock-m2", title: "Last Light", description: "A post-apocalyptic survival story.", genre: ["Drama", "Sci-Fi"], releaseYear: 2023, year: 2023, status: "published", premium: true, durationMinutes: 108, director: "M. Tanaka", thumbnail: "", poster: "", banner: "", trailerUrl: "" },
  { _id: "mock-m3", id: "mock-m3", title: "Paper Cities", description: "An indie drama about friendship and change.", genre: ["Drama"], releaseYear: 2024, year: 2024, status: "draft", premium: false, durationMinutes: 96, director: "L. Park", thumbnail: "", poster: "", banner: "", trailerUrl: "" },
];

// Mock data lookup helpers
function getMockSeriesById(seriesId) {
  if (!seriesId) return null;
  return MOCK_SERIES.find(s => s._id === seriesId || s.id === seriesId) || null;
}

function getMockEpisodes(seriesId, seasonId) {
  const series = getMockSeriesById(seriesId);
  if (!series || !Array.isArray(series.seasons)) return [];
  const season = series.seasons.find(s => s._id === seasonId || s.id === seasonId);
  if (!season) return [];
  return Array.isArray(season.episodes) ? season.episodes : [];
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
function Table({ columns, rows, emptyMsg }) {
  const safeColumns = columns || [];
  const safeRows = rows || [];
  return (
    <div className="table-scroll-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ minWidth: 700, display: 'grid', gridTemplateColumns: safeColumns.map(c => c.width || '1fr').join(' '),
        background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px', gap: 8,
      }}>
        {safeColumns.map(c => (
          <div key={c.key} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
        ))}
      </div>
      {safeRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 13 }}>{emptyMsg}</div>
      ) : (
        safeRows.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: safeColumns.map(c => c.width || '1fr').join(' '),
            padding: '12px 16px', gap: 8, alignItems: 'center',
            borderBottom: i < safeRows.length - 1 ? '1px solid var(--border)' : 'none',
            background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)'}
          >
            {safeColumns.map(c => (
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GENRES = ['Action', 'Comedy', 'Crime', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation'];
const STATUSES = ['Published', 'Draft', 'Archived'];

function safeStr(v, fallback = '') { return v ?? fallback; }
function safeArr(v) { return Array.isArray(v) ? v : []; }
function safeNum(v, fallback = 0) { const n = Number(v); return isNaN(n) ? fallback : n; }
function capitalize(s) { if (!s) return 'Draft'; return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
function genreToStr(v) { return Array.isArray(v) ? v.join(', ') : (v || ''); }

// ─── THUMBNAIL CELL ──────────────────────────────────────────────────────────
function ThumbnailCell({ src, fallbackIcon: Icon = Tv, size = { w: 32, h: 32 } }) {
  if (src) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={src} alt="" style={{ width: size.w, height: size.h, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
        <div style={{ width: size.w, height: size.h, borderRadius: 6, background: 'var(--bg-elevated)', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color="var(--text-muted)" />
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: size.w, height: size.h, borderRadius: 6, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={14} color="var(--text-muted)" />
    </div>
  );
}

// ─── SERIES FORM ──────────────────────────────────────────────────────────────
function SeriesForm({ initial, onSave, onCancel }) {
  const defaults = {
    title: '', releaseYear: new Date().getFullYear(), description: '',
    genre: '', tags: [], premium: false, status: 'Draft',
    poster: '', thumbnail: '', banner: '', trailerUrl: '',
    posterPublicId: '', bannerPublicId: '',
  };
  const safeInitial = initial || {};
  const [form, setForm] = useState({
    ...defaults,
    ...safeInitial,
    genre: genreToStr(safeInitial.genre),
    status: capitalize(safeInitial.status),
    tags: safeArr(safeInitial.tags),
    poster: safeInitial.poster || safeInitial.thumbnail || '',
    thumbnail: safeInitial.poster || safeInitial.thumbnail || '',
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
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>{safeStr(form.description).length}/500</div>
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
              {safeArr(form.tags).map(t => (
                <span key={t} style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {t}<X size={9} style={{ cursor: 'pointer' }} onClick={() => set('tags', safeArr(form.tags).filter(x => x !== t))} />
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { set('tags', [...safeArr(form.tags), tagInput.trim()]); setTagInput(''); e.preventDefault(); } }}
                placeholder="Add tag, press Enter..." style={{ border: 'none', background: 'none', padding: 0, width: 140, fontSize: 12 }} />
            </div>
          </Field>
          <Toggle checked={!!form.premium} onChange={v => set('premium', v)} label="Premium Series" sub="Only premium users can watch" />
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Media</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
          <Field label="Poster">
            <FileDropzone accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024}
              label="Upload poster" currentUrl={form.poster || form.thumbnail}
              onUpload={async (file) => { const res = await adminUploadImage(file, 'streamvault/series/posters'); set('poster', res.data?.url || ''); set('thumbnail', res.data?.url || ''); set('posterPublicId', res.data?.publicId || ''); }}
              onRemove={() => { set('poster', ''); set('thumbnail', ''); set('posterPublicId', ''); }} />
          </Field>
          <Field label="Banner">
            <FileDropzone accept="image/jpeg,image/png,image/webp" maxSize={10 * 1024 * 1024}
              label="Upload banner" currentUrl={form.banner}
              onUpload={async (file) => { const res = await adminUploadImage(file, 'streamvault/series/banners'); set('banner', res.data?.url || ''); set('bannerPublicId', res.data?.publicId || ''); }}
              onRemove={() => { set('banner', ''); set('bannerPublicId', ''); }} />
          </Field>
          <Field label="Trailer Video">
            <FileDropzone
              accept="video/mp4,video/webm,video/quicktime,video/*"
              maxSize={500 * 1024 * 1024}
              label="Upload trailer video (MP4, WebM)"
              currentUrl={form.trailerUrl}
              onUpload={async (file) => { const res = await adminUploadVideo(file, 'streamvault/series/trailers'); set('trailerUrl', res.data?.url || ''); }}
              onRemove={() => set('trailerUrl', '')} />
          </Field>
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
function SeasonForm({ initial, onSave, onCancel, seriesList = [] }) {
  console.log('--- SeasonForm RENDER ---');
  console.log('  INITIAL PROP:', initial);
  console.log('  initial?.id:', initial?.id);
  console.log('  initial?._id:', initial?._id);
  console.log('  initial keys:', initial ? Object.keys(initial) : 'null');
  const defaults = {
    id: '', seriesId: '', title: '', releaseYear: new Date().getFullYear(), description: '', status: 'Draft', premium: false,
  };
  const safeInitial = initial || {};
  const [form, setForm] = useState({
    ...defaults,
    ...safeInitial,
    status: capitalize(safeInitial.status),
    premium: safeInitial.premium || false,
  });
  console.log('  FORM STATE after useState:', { id: form.id, _id: form._id, title: form.title });

  // Sync form state when initial prop changes (e.g., switching from add to edit)
  useEffect(() => {
    const si = initial || {};
    console.log('  SeasonForm useEffect SYNC triggered');
    console.log('    si.id:', si.id);
    console.log('    si._id:', si._id);
    setForm({
      ...defaults,
      ...si,
      status: capitalize(si.status),
      premium: si.premium || false,
    });
  }, [initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Season Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {seriesList.length > 0 && (
            <Field label="Series" required>
              <select value={form.seriesId} onChange={e => set('seriesId', e.target.value)} disabled={!!initial}>
                <option value="">Select series</option>
                {seriesList.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.title}</option>)}
              </select>
            </Field>
          )}
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
          <Toggle checked={!!form.premium} onChange={v => set('premium', v)} label="Premium Season" sub="Only premium users can access this season" />
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
  console.log('--- EpisodeForm RENDER ---');
  console.log('  INITIAL PROP:', initial);
  console.log('  initial?.id:', initial?.id);
  console.log('  initial?._id:', initial?._id);
  console.log('  initial keys:', initial ? Object.keys(initial) : 'null');
  const defaults = {
    id: '', seriesId: contextSeriesId || '', seasonId: contextSeasonId || '', title: '', number: 1, duration: '', description: '', status: 'Draft', premium: false,
    thumbnail: '', videoUrl: '', previewVideoUrl: '',
    thumbnailPublicId: '', videoPublicId: '', previewVideoPublicId: '',
  };
  const safeInitial = initial || {};
  const [form, setForm] = useState({
    ...defaults,
    ...safeInitial,
    status: capitalize(safeInitial.status),
    premium: safeInitial.premium || false,
  });
  console.log('  FORM STATE after useState:', { id: form.id, _id: form._id, title: form.title });

  // Sync form state when initial prop changes (e.g., switching from add to edit)
  useEffect(() => {
    const si = initial || {};
    console.log('  EpisodeForm useEffect SYNC triggered');
    console.log('    si.id:', si.id);
    console.log('    si._id:', si._id);
    setForm({
      ...defaults,
      ...si,
      status: capitalize(si.status),
      premium: si.premium || false,
    });
  }, [initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Episode Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <Toggle checked={!!form.premium} onChange={v => set('premium', v)} label="Premium Episode" sub="Only premium users can access this episode" />
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Media</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Thumbnail">
            <FileDropzone accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024}
              label="Upload episode thumbnail" currentUrl={form.thumbnail}
              onUpload={async (file) => { const res = await adminUploadImage(file, 'streamvault/episodes/thumbnails'); set('thumbnail', res.data?.url || ''); set('thumbnailPublicId', res.data?.publicId || ''); }}
              onRemove={() => { set('thumbnail', ''); set('thumbnailPublicId', ''); }} />
          </Field>
          <Field label="Video File">
            <FileDropzone accept="video/mp4,video/webm,video/quicktime" maxSize={5 * 1024 * 1024 * 1024}
              label="Upload episode video" currentUrl={form.videoUrl}
              onUpload={async (file) => { const res = await adminUploadVideo(file, 'streamvault/episodes/videos'); set('videoUrl', res.data?.url || ''); set('videoPublicId', res.data?.publicId || ''); }}
              onRemove={() => { set('videoUrl', ''); set('videoPublicId', ''); }} />
            {form.videoUrl && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <video src={form.videoUrl} controls style={{ width: '100%', maxHeight: 160, background: '#000' }} />
              </div>
            )}
          </Field>
          <Field label="Preview Video (Optional)">
            <FileDropzone accept="video/mp4,video/webm,video/quicktime" maxSize={100 * 1024 * 1024}
              label="Upload preview clip" currentUrl={form.previewVideoUrl}
              onUpload={async (file) => { const res = await adminUploadVideo(file, 'streamvault/episodes/previews'); set('previewVideoUrl', res.data?.url || ''); set('previewVideoPublicId', res.data?.publicId || ''); }}
              onRemove={() => { set('previewVideoUrl', ''); set('previewVideoPublicId', ''); }} />
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
  const defaults = {
    title: '', releaseYear: new Date().getFullYear(), description: '',
    genre: '', director: '', duration: '', tags: [], premium: false, status: 'Draft',
    poster: '', thumbnail: '', banner: '', trailerUrl: '', videoUrl: '',
    posterPublicId: '', bannerPublicId: '', videoPublicId: '',
  };
  const safeInitial = initial || {};
  const [form, setForm] = useState({
    ...defaults,
    ...safeInitial,
    genre: genreToStr(safeInitial.genre),
    duration: safeInitial.duration || safeInitial.durationMinutes || '',
    videoUrl: safeInitial.videoUrl || safeInitial.video?.url || '',
    status: capitalize(safeInitial.status),
    tags: safeArr(safeInitial.tags),
    poster: safeInitial.poster || safeInitial.thumbnail || '',
    thumbnail: safeInitial.poster || safeInitial.thumbnail || '',
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
              {safeArr(form.tags).map(t => (
                <span key={t} style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {t}<X size={9} style={{ cursor: 'pointer' }} onClick={() => set('tags', safeArr(form.tags).filter(x => x !== t))} />
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { set('tags', [...safeArr(form.tags), tagInput.trim()]); setTagInput(''); e.preventDefault(); } }}
                placeholder="Add tag, press Enter..." style={{ border: 'none', background: 'none', padding: 0, width: 140, fontSize: 12 }} />
            </div>
          </Field>
          <Toggle checked={!!form.premium} onChange={v => set('premium', v)} label="Premium Movie" sub="Only premium users can watch" />
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Media</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
            <Field label="Poster">
              <FileDropzone accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024}
                label="Upload poster" currentUrl={form.poster || form.thumbnail}
                onUpload={async (file) => { const res = await adminUploadImage(file, 'streamvault/movies/posters'); set('poster', res.data?.url || ''); set('thumbnail', res.data?.url || ''); set('posterPublicId', res.data?.publicId || ''); }}
                onRemove={() => { set('poster', ''); set('thumbnail', ''); set('posterPublicId', ''); }} />
            </Field>
            <Field label="Banner">
              <FileDropzone accept="image/jpeg,image/png,image/webp" maxSize={10 * 1024 * 1024}
                label="Upload banner" currentUrl={form.banner}
                onUpload={async (file) => { const res = await adminUploadImage(file, 'streamvault/movies/banners'); set('banner', res.data?.url || ''); set('bannerPublicId', res.data?.publicId || ''); }}
                onRemove={() => { set('banner', ''); set('bannerPublicId', ''); }} />
            </Field>
          </div>
          <Field label="Trailer Video">
            <FileDropzone
              accept="video/mp4,video/webm,video/quicktime,video/*"
              maxSize={500 * 1024 * 1024}
              label="Upload trailer video (MP4, WebM)"
              currentUrl={form.trailerUrl}
              onUpload={async (file) => { const res = await adminUploadVideo(file, 'streamvault/movies/trailers'); set('trailerUrl', res.data?.url || ''); }}
              onRemove={() => set('trailerUrl', '')} />
          </Field>
          <Field label="Video File">
            <FileDropzone accept="video/mp4,video/webm,video/quicktime" maxSize={5 * 1024 * 1024 * 1024}
              label="Upload movie file" currentUrl={form.videoUrl}
              onUpload={async (file) => { const res = await adminUploadVideo(file, 'streamvault/movies/videos'); set('videoUrl', res.data?.url || ''); set('videoPublicId', res.data?.publicId || ''); }}
              onRemove={() => { set('videoUrl', ''); set('videoPublicId', ''); }} />
            {form.videoUrl && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <video src={form.videoUrl} controls style={{ width: '100%', maxHeight: 200, background: '#000' }} />
              </div>
            )}
          </Field>
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

// ─── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, width = 600, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: width,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 14,
            letterSpacing: '0.1em', color: 'var(--text-primary)',
            fontWeight: 700,
          }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              padding: 4, borderRadius: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── DELETE CONFIRMATION MODAL ────────────────────────────────────────────────
function DeleteModal({ open, onClose, onConfirm, itemName, itemType = 'Item' }) {
  const [confirmText, setConfirmText] = useState('');
  useEffect(() => { if (open) setConfirmText(''); }, [open]);

  if (!open) return null;
  const expected = 'delete';
  const matches = confirmText.trim().toLowerCase() === expected;

  return (
    <Modal open={open} onClose={onClose} title={`DELETE ${itemType.toUpperCase()}`} width={460}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--red-dim)', color: 'var(--red)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Are you sure?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            This will permanently delete <b style={{ color: 'var(--text-primary)' }}>{itemName || `this ${itemType.toLowerCase()}`}</b>.
            This action cannot be undone.
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          Type <code style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>delete</code> to confirm:
        </label>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="delete"
          autoFocus
          style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={onConfirm} disabled={!matches}>
          <Trash2 size={12} /> Delete {itemType}
        </Btn>
      </div>
    </Modal>
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
  const safeSeriesList = safeArr(seriesList);

  if (CMS_DEV_MODE) {
    console.log('SeriesTab: seriesList count =', safeSeriesList.length);
  }

  const filtered = useMemo(() =>
    safeSeriesList.filter(s =>
      safeStr(s.title).toLowerCase().includes(search.toLowerCase()) ||
      safeStr(Array.isArray(s.genre) ? s.genre.join(' ') : s.genre).toLowerCase().includes(search.toLowerCase()) ||
      safeStr(s.status).toLowerCase().includes(search.toLowerCase())
    ), [safeSeriesList, search]);

  const handleSave = async (form) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', safeStr(form.title));
      fd.append('release_year', String(safeNum(form.releaseYear)));
      fd.append('description', safeStr(form.description));
      fd.append('genre_ids', safeStr(form.genre));
      fd.append('tags', safeArr(form.tags).join(','));
      fd.append('is_premium', form.premium ? 'true' : 'false');
      fd.append('status', safeStr(form.status || 'Draft').toLowerCase());
      if (form.trailerUrl) fd.append('trailer_url', form.trailerUrl);
      if (form.poster || form.thumbnail) fd.append('poster_url', form.poster || form.thumbnail);
      if (form.posterPublicId) fd.append('poster_public_id', form.posterPublicId);
      if (form.banner) fd.append('banner_url', form.banner);
      if (form.bannerPublicId) fd.append('banner_public_id', form.bannerPublicId);

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
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Series save failed, UI preserved:', err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteSeries(deleteTarget.id || deleteTarget._id);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      console.error('Series delete error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Series delete failed, UI preserved:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'poster', label: 'Poster', width: '50px' },
    { key: 'title', label: 'Title', width: '2fr' },
    { key: 'genre', label: 'Genre', width: '1fr' },
    { key: 'year', label: 'Year', width: '70px' },
    { key: 'seasons', label: 'Seasons', width: '80px' },
    { key: 'status', label: 'Status', width: '110px' },
    { key: 'actions', label: 'Actions', width: '90px' },
  ];

  const rows = filtered.map(s => ({
    poster: <ThumbnailCell src={s.poster || s.thumbnail} fallbackIcon={Tv} />,
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{safeStr(s.title)}</div>
          {s.premium && <span style={{ fontSize: 10, background: 'rgba(245,197,24,0.15)', color: 'var(--accent)', padding: '0 5px', borderRadius: 3, fontWeight: 700 }}>PRO</span>}
        </div>
      </div>
    ),
    genre: <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{Array.isArray(s.genre) ? safeArr(s.genre).join(', ') : safeStr(s.genre, '—')}</span>,
    year: <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.releaseYear || s.year || '—'}</span>,
    seasons: <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.seasonCount || (Array.isArray(s.seasons) ? s.seasons.length : (s.seasons || 0))}</span>,
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
        {modal?.item && <SeriesDetailView seriesId={modal.item.id || modal.item._id} seriesData={modal.item} onBack={() => setModal(null)} />}
      </Modal>

      <Modal open={modal?.mode === 'add' || modal?.mode === 'edit'} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'EDIT SERIES' : 'ADD NEW SERIES'} width={620}>
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
function SeriesDetailView({ seriesId, seriesData, onBack }) {
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodesBySeason, setEpisodesBySeason] = useState({});
  const [expandedSeason, setExpandedSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasonModal, setSeasonModal] = useState(null);
  const [episodeModal, setEpisodeModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [seriesList, setSeriesList] = useState([]);
  const [usingMock, setUsingMock] = useState(false);

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);

      // Try API first
      let data = null;
      let apiFailed = false;

      try {
        const res = await getSeriesById(seriesId);
        // API wrapper returns parsed JSON directly, so res IS the data
        // The response might be { data: {...} } or the series object directly
        data = res?.data || res || null;
        if (CMS_DEV_MODE) console.log('Series API:', data);
      } catch (apiErr) {
        apiFailed = true;
        if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] getSeriesById API failed:', apiErr.message);
      }

      // Check if data is valid - must have at least a title
      const hasValidData = data && (data.title || data._id || data.id);

      // Fall back to mock data if API failed or returned invalid data
      if ((!hasValidData || apiFailed) && USE_MOCK_CONTENT) {
        const mockData = getMockSeriesById(seriesId);
        if (mockData) {
          data = mockData;
          setUsingMock(true);
          if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Using mock data for series:', seriesId);
        } else if (!hasValidData) {
          // Use seriesData passed from parent as last resort
          data = seriesData || null;
          if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Using parent seriesData for series:', seriesId);
        }
      }

      if (!data) {
        setSeries(null);
        setSeasons([]);
        setEpisodesBySeason({});
        setLoading(false);
        return;
      }

      setSeries(data);

      // Extract seasons defensively
      const seasonsData = Array.isArray(data.seasons) ? data.seasons : [];
      setSeasons(seasonsData);
      if (CMS_DEV_MODE) console.log('Seasons:', seasonsData);

      // Fetch episodes for each season
      const epMap = {};
      for (const season of seasonsData) {
        const seasonId = season._id || season.id;
        if (!seasonId) continue;

        try {
          const epRes = await getEpisodes(seriesId, seasonId);
          // epRes might be { data: [...] } or [...] directly
          const eps = Array.isArray(epRes?.data) ? epRes.data : (Array.isArray(epRes) ? epRes : []);
          epMap[seasonId] = eps;
        } catch {
          // Fall back to episodes embedded in season data
          epMap[seasonId] = Array.isArray(season.episodes) ? season.episodes : [];
        }
      }

      // If no episodes were fetched but mock data has them, use mock episodes
      if (USE_MOCK_CONTENT && usingMock) {
        for (const season of seasonsData) {
          const seasonId = season._id || season.id;
          if (!epMap[seasonId] || epMap[seasonId].length === 0) {
            const mockEps = getMockEpisodes(seriesId, seasonId);
            if (mockEps.length > 0) {
              epMap[seasonId] = mockEps;
            }
          }
        }
      }

      setEpisodesBySeason(epMap);
      if (CMS_DEV_MODE) console.log('Episodes:', epMap);
    } catch (err) {
      console.error('Fetch series detail error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] SeriesDetailView fetch failed, showing graceful state');

      // Last resort: try mock data
      if (USE_MOCK_CONTENT) {
        const mockData = getMockSeriesById(seriesId);
        if (mockData) {
          setSeries(mockData);
          const mockSeasons = Array.isArray(mockData.seasons) ? mockData.seasons : [];
          setSeasons(mockSeasons);
          const epMap = {};
          for (const season of mockSeasons) {
            const sid = season._id || season.id;
            epMap[sid] = Array.isArray(season.episodes) ? season.episodes : [];
          }
          setEpisodesBySeason(epMap);
          setUsingMock(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [seriesId, seriesData, usingMock]);

  useEffect(() => { fetchSeries(); }, [seriesId]); // Only re-fetch when seriesId changes

  const totalEpisodes = Object.values(episodesBySeason).reduce((acc, eps) => acc + safeArr(eps).length, 0);

  const handleSaveSeason = async (form) => {
    try {
      const payload = {
        title: safeStr(form.title),
        release_year: parseInt(safeStr(form.releaseYear), 10) || null,
        description: safeStr(form.description),
        status: safeStr(form.status || 'Draft').toLowerCase(),
        is_premium: form.premium ? 'true' : 'false',
      };

      if (seasonModal?.mode === 'edit') {
        const seasonId = form.id || form._id;
        if (!seasonId) {
          console.error('Missing season ID');
          alert('Cannot update season: missing ID');
          return;
        }
        if (CMS_DEV_MODE) {
          console.log('Editing season:', form);
          console.log('Season ID:', seasonId);
        }
        await updateSeason(seriesId, seasonId, payload);
      } else {
        await createSeason(seriesId, { ...payload, seriesId });
      }
      setSeasonModal(null);
      fetchSeries();
    } catch (err) {
      console.error('Season save error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Season save failed, UI preserved:', err.message);
      alert(err.message);
    }
  };

  const handleSaveEpisode = async (form) => {
    console.log('=== handleSaveEpisode CALLED ===');
    console.log('  form:', form);
    console.log('  form.id:', form.id);
    console.log('  form._id:', form._id);
    console.log('  form keys:', Object.keys(form));
    console.log('  episodeModal:', episodeModal);
    console.log('  episodeModal?.mode:', episodeModal?.mode);
    console.log('  seriesId (from props):', seriesId);
    try {
      const targetSeasonId = form.seasonId || episodeModal?.seasonId;
      if (episodeModal?.mode === 'edit') {
        const episodeId = form.id || form._id;
        console.log('  EPISODE EDIT: resolved episodeId:', episodeId);
        console.log('  EPISODE EDIT: typeof episodeId:', typeof episodeId);
        console.log('  EPISODE EDIT: PATCH URL:', `/episodes/${episodeId}`);
        if (!episodeId) {
          console.error('Missing episode ID');
          alert('Cannot update episode: missing ID');
          return;
        }
        const fd = new FormData();
        fd.append('title', safeStr(form.title));
        fd.append('episode_number', String(parseInt(safeStr(form.number), 10) || 1));
        fd.append('duration_minutes', String(parseInt(safeStr(form.duration), 10) || 0));
        fd.append('description', safeStr(form.description));
        fd.append('status', safeStr(form.status || 'Draft').toLowerCase());
        fd.append('is_premium', form.premium ? 'true' : 'false');
        if (form.thumbnail) fd.append('thumbnail_url', form.thumbnail);
        if (form.thumbnailPublicId) fd.append('thumbnail_public_id', form.thumbnailPublicId);
        if (form.videoUrl) fd.append('video_url', form.videoUrl);
        if (form.videoPublicId) fd.append('video_public_id', form.videoPublicId);
        if (form.previewVideoUrl) fd.append('preview_video_url', form.previewVideoUrl);
        if (form.previewVideoPublicId) fd.append('preview_video_public_id', form.previewVideoPublicId);
        await updateEpisode(episodeId, fd);
      } else {
        if (!targetSeasonId) return alert('Season ID is required');
        const formData = new FormData();
        formData.append('title', safeStr(form.title));
        formData.append('episode_number', String(parseInt(safeStr(form.number), 10) || 1));
        formData.append('duration_minutes', String(parseInt(safeStr(form.duration), 10) || 0));
        formData.append('description', safeStr(form.description));
        formData.append('status', safeStr(form.status || 'Draft').toLowerCase());
        formData.append('is_premium', form.premium ? 'true' : 'false');
        if (form.thumbnail) formData.append('thumbnail_url', form.thumbnail);
        if (form.thumbnailPublicId) formData.append('thumbnail_public_id', form.thumbnailPublicId);
        if (form.videoUrl) formData.append('video_url', form.videoUrl);
        if (form.videoPublicId) formData.append('video_public_id', form.videoPublicId);
        if (form.previewVideoUrl) formData.append('preview_video_url', form.previewVideoUrl);
        if (form.previewVideoPublicId) formData.append('preview_video_public_id', form.previewVideoPublicId);
        await createEpisode(seriesId, targetSeasonId, formData);
      }
      setEpisodeModal(null);
      fetchSeries();
    } catch (err) {
      console.error('Episode save error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Episode save failed, UI preserved:', err.message);
      alert(err.message);
    }
  };

  const handleDeleteSeason = async () => {
    try {
      await deleteSeason(seriesId, deleteTarget.id || deleteTarget._id);
      setDeleteTarget(null);
      fetchSeries();
    } catch (err) {
      console.error('Delete season error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Season delete failed, UI preserved:', err.message);
    }
  };

  const handleDeleteEpisode = async () => {
    try {
      await deleteEpisode(deleteTarget.id || deleteTarget._id);
      setDeleteTarget(null);
      fetchSeries();
    } catch (err) {
      console.error('Delete episode error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Episode delete failed, UI preserved:', err.message);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading series details...</div>;
  }

  if (!series) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Series not found</div>
        <div style={{ fontSize: 12 }}>The series data could not be loaded. Please try again later.</div>
      </div>
    );
  }

  // Defensive extraction of series properties
  const seriesTitle = safeStr(series.title, 'Untitled Series');
  const seriesBanner = series.banner || '';
  const seriesPoster = series.poster || series.thumbnail || '';
  const seriesLogo = series.logoUrl || series.logo || '';
  const seriesTrailer = series.trailerUrl || series.trailer || '';
  const seriesGenre = Array.isArray(series.genre) ? safeArr(series.genre).join(', ') : safeStr(series.genre, '');
  const safeSeasons = Array.isArray(seasons) ? seasons : [];

  return (
    <div>
      {/* Mock data indicator */}
      {usingMock && CMS_DEV_MODE && (
        <div style={{
          background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)',
          borderRadius: 6, padding: '6px 12px', marginBottom: 12, fontSize: 11,
          color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertTriangle size={12} /> Using mock data — backend integration pending
        </div>
      )}

      {/* Series header with media */}
      <div style={{ marginBottom: 20 }}>
        {seriesBanner && (
          <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', maxHeight: 120 }}>
            <img src={seriesBanner} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {seriesPoster && (
            <img src={seriesPoster} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          {seriesLogo && (
            <img src={seriesLogo} alt="" style={{ height: 24, objectFit: 'contain', flexShrink: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: 'var(--text-primary)' }}>{seriesTitle}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {safeSeasons.length} seasons · {totalEpisodes} episodes
              {seriesGenre && <span> · {seriesGenre}</span>}
            </div>
            {seriesTrailer && (
              <a href={seriesTrailer} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <ExternalLink size={10} /> Watch Trailer
              </a>
            )}
          </div>
          <Badge status={series.status === 'published' ? 'Published' : series.status === 'draft' ? 'Draft' : (series.status || 'Draft')} />
        </div>
      </div>

      {/* Seasons list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {safeSeasons.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
            No seasons available. Add the first season!
          </div>
        )}

        {safeSeasons.map((season, seasonIdx) => {
          const seasonId = season._id || season.id || `season-${seasonIdx}`;
          const eps = Array.isArray(episodesBySeason[seasonId]) ? episodesBySeason[seasonId] : (Array.isArray(season.episodes) ? season.episodes : []);
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
                  {season.poster ? (
                    <img src={season.poster} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: 'var(--accent-subtle)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                    }}>{season.order || season.seasonNumber || seasonIdx + 1}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{safeStr(season.title, `Season ${seasonIdx + 1}`)}{season.premium && <span style={{ fontSize: 10, background: 'rgba(245,197,24,0.15)', color: 'var(--accent)', padding: '0 5px', borderRadius: 3, fontWeight: 700, marginLeft: 6 }}>PRO</span>}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{eps.length} episodes · {season.releaseYear || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge status={season.status === 'published' ? 'Published' : season.status === 'draft' ? 'Draft' : 'Archived'} />
                  <Btn variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    const editItem = { ...season, id: seasonId, seriesId };
                    console.log('=== EDIT SEASON CLICKED ===');
                    console.log('season object:', season);
                    console.log('season keys:', Object.keys(season));
                    console.log('season._id:', season._id);
                    console.log('season.id:', season.id);
                    console.log('seasonId (computed):', seasonId);
                    console.log('editItem.id:', editItem.id);
                    console.log('editItem._id:', editItem._id);
                    setSeasonModal({ mode: 'edit', item: editItem });
                  }}>
                    <Edit2 size={11} />
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ ...season, id: seasonId }); setDeleteType('season'); }} style={{ color: 'var(--red)' }}>
                    <Trash2 size={11} />
                  </Btn>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px' }}>
                  {eps.length === 0 ? (
                    <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      No episodes available.
                    </div>
                  ) : (
                    eps.map((ep, idx) => {
                      const epThumb = ep.thumbnail || '';
                      const epTitle = safeStr(ep.title, `Episode ${ep.episodeNumber || ep.number || idx + 1}`);
                      const epDuration = ep.durationMinutes || ep.duration || '';
                      const epVideoUrl = ep.video?.url || ep.videoUrl || '';
                      const epStatus = ep.status === 'published' ? 'Published' : ep.status === 'draft' ? 'Draft' : 'Archived';

                      return (
                        <div key={ep._id || ep.id || idx} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 0', borderBottom: idx < eps.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          {epThumb ? (
                            <img src={epThumb} alt="" style={{ width: 40, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                              onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, flexShrink: 0,
                            }}>{ep.episodeNumber || ep.number || idx + 1}</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{epTitle}{ep.premium && <span style={{ fontSize: 10, background: 'rgba(245,197,24,0.15)', color: 'var(--accent)', padding: '0 5px', borderRadius: 3, fontWeight: 700, marginLeft: 6 }}>PRO</span>}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {epDuration ? `${epDuration}m` : '—'}
                            </div>
                          </div>
                          {epVideoUrl && epVideoUrl !== '/John_Wick.mp4' && (
                            <Btn variant="ghost" size="sm" onClick={() => window.open(epVideoUrl, '_blank')} style={{ padding: '4px 6px' }}>
                              <Play size={11} />
                            </Btn>
                          )}
                          <Badge status={epStatus} />
                          <Btn variant="ghost" size="sm" onClick={() => {
                            const editItem = { ...ep, id: ep._id || ep.id, seriesId, seasonId, number: ep.episodeNumber || ep.number, duration: ep.durationMinutes || ep.duration, thumbnail: ep.thumbnail, thumbnailPublicId: ep.thumbnailPublicId || '', videoUrl: epVideoUrl, videoPublicId: ep.video?.publicId || ep.videoPublicId || '', previewVideoUrl: ep.previewVideoUrl || '', previewVideoPublicId: ep.previewVideoPublicId || '', premium: ep.premium || false };
                            console.log('=== EDIT EPISODE CLICKED ===');
                            console.log('ep keys:', Object.keys(ep));
                            console.log('ep._id:', ep._id, '| ep.id:', ep.id);
                            console.log('editItem.id:', editItem.id);
                            setEpisodeModal({ mode: 'edit', item: editItem });
                          }}>
                            <Edit2 size={11} />
                          </Btn>
                          <Btn variant="ghost" size="sm" onClick={() => { setDeleteTarget({ ...ep, id: ep._id || ep.id }); setDeleteType('episode'); }} style={{ color: 'var(--red)' }}>
                            <Trash2 size={11} />
                          </Btn>
                        </div>
                      );
                    })
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
      <Modal open={!!seasonModal} onClose={() => setSeasonModal(null)} title={seasonModal?.mode === 'edit' ? 'EDIT SEASON' : 'ADD NEW SEASON'} width={580}>
        <SeasonForm
          initial={seasonModal?.mode === 'edit' ? seasonModal.item : null}
          onSave={handleSaveSeason}
          onCancel={() => setSeasonModal(null)}
          seriesList={seriesList}
        />
      </Modal>

      {/* Episode Modal */}
      <Modal open={!!episodeModal} onClose={() => setEpisodeModal(null)} title={episodeModal?.mode === 'edit' ? 'EDIT EPISODE' : 'ADD NEW EPISODE'} width={620}>
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
  const safeMoviesList = safeArr(moviesList);

  if (CMS_DEV_MODE) {
    console.log('MoviesTab: moviesList count =', safeMoviesList.length);
  }

  const filtered = useMemo(() =>
    safeMoviesList.filter(m =>
      safeStr(m.title).toLowerCase().includes(search.toLowerCase()) ||
      safeStr(Array.isArray(m.genre) ? m.genre.join(' ') : m.genre).toLowerCase().includes(search.toLowerCase()) ||
      safeStr(m.director).toLowerCase().includes(search.toLowerCase()) ||
      safeStr(m.status).toLowerCase().includes(search.toLowerCase())
    ), [safeMoviesList, search]);

  const handleSave = async (form) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', safeStr(form.title));
      fd.append('release_year', String(safeNum(form.releaseYear)));
      fd.append('duration_minutes', String(parseInt(safeStr(form.duration), 10) || 0));
      fd.append('description', safeStr(form.description));
      fd.append('genre_ids', safeStr(form.genre));
      fd.append('tags', safeArr(form.tags).join(','));
      fd.append('director', safeStr(form.director));
      fd.append('is_premium', form.premium ? 'true' : 'false');
      fd.append('status', safeStr(form.status || 'Draft').toLowerCase());
      if (form.poster || form.thumbnail) fd.append('poster_url', form.poster || form.thumbnail);
      if (form.posterPublicId) fd.append('poster_public_id', form.posterPublicId);
      if (form.banner) fd.append('banner_url', form.banner);
      if (form.bannerPublicId) fd.append('banner_public_id', form.bannerPublicId);
      if (form.trailerUrl) fd.append('trailer_url', form.trailerUrl);
      if (form.videoUrl) fd.append('video_url', form.videoUrl);
      if (form.videoPublicId) fd.append('video_public_id', form.videoPublicId);

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
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Movie save failed, UI preserved:', err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMovie(deleteTarget.id || deleteTarget._id);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      console.error('Movie save error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Movie delete failed, UI preserved:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'poster', label: 'Poster', width: '50px' },
    { key: 'title', label: 'Title', width: '2fr' },
    { key: 'genre', label: 'Genre', width: '1fr' },
    { key: 'year', label: 'Year', width: '70px' },
    { key: 'status', label: 'Status', width: '110px' },
    { key: 'actions', label: 'Actions', width: '90px' },
  ];

  const rows = filtered.map(m => ({
    poster: <ThumbnailCell src={m.poster || m.thumbnail} fallbackIcon={Film} size={{ w: 28, h: 40 }} />,
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{safeStr(m.title)}</div>
          {m.premium && <span style={{ fontSize: 10, background: 'rgba(245,197,24,0.15)', color: 'var(--accent)', padding: '0 5px', borderRadius: 3, fontWeight: 700 }}>PRO</span>}
        </div>
      </div>
    ),
    genre: <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{Array.isArray(m.genre) ? safeArr(m.genre).join(', ') : safeStr(m.genre, '—')}</span>,
    year: <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{m.releaseYear || m.year || '—'}</span>,
    status: <Badge status={m.status === 'published' ? 'Published' : m.status === 'draft' ? 'Draft' : 'Archived'} />,
    actions: <Actions
      onEdit={() => setModal({ mode: 'edit', item: { ...m, releaseYear: m.releaseYear || m.year, duration: m.durationMinutes || m.duration, genre: Array.isArray(m.genre) ? m.genre.join(', ') : m.genre, poster: m.poster || m.thumbnail, thumbnail: m.poster || m.thumbnail, posterPublicId: m.posterPublicId || '', banner: m.banner, bannerPublicId: m.bannerPublicId || '', trailerUrl: m.trailerUrl, videoUrl: m.video?.url || m.videoUrl, videoPublicId: m.video?.publicId || m.videoPublicId || '' } })}
      onDelete={() => setDeleteTarget(m)} />,
  }));

  return (
    <div>
      <ListBar search={search} onSearch={setSearch} onAdd={() => setModal({ mode: 'add', item: null })} addLabel="Add Movie" count={filtered.length} label="movies" />
      <Table columns={columns} rows={rows} emptyMsg={search ? `No movies matching "${search}"` : 'No movies yet. Add your first movie!'} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'EDIT MOVIE' : 'ADD NEW MOVIE'} width={620}>
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
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname.includes('/movies') ? 'movies' : 'series');
  const [seriesList, setSeriesList] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      let seriesData = [];
      let moviesData = [];
      let mockUsed = false;

      let apiFailedSeries = false;
      let apiFailedMovies = false;

      try {
        const [seriesRes, moviesRes] = await Promise.allSettled([
          getSeries({ limit: 100 }),
          getMovies({ limit: 100 }),
        ]);

        if (seriesRes.status === 'fulfilled') {
          // API wrapper returns parsed JSON directly
          // Response might be { data: [...] } or [...] directly
          const raw = seriesRes.value;
          seriesData = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        } else {
          apiFailedSeries = true;
        }
        
        if (moviesRes.status === 'fulfilled') {
          const raw = moviesRes.value;
          moviesData = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        } else {
          apiFailedMovies = true;
        }

        if (CMS_DEV_MODE) {
          console.log('Series API:', seriesData);
          console.log('Movies API:', moviesData);
        }
      } catch (apiErr) {
        if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Content API failed:', apiErr.message);
        apiFailedSeries = true;
        apiFailedMovies = true;
      }

      // Fall back to mock data if API failed
      if (USE_MOCK_CONTENT && apiFailedSeries) {
        seriesData = MOCK_SERIES;
        mockUsed = true;
        if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Using mock series data');
      }
      if (USE_MOCK_CONTENT && apiFailedMovies) {
        moviesData = MOCK_MOVIES;
        mockUsed = true;
        if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Using mock movies data');
      }

      setSeriesList(seriesData);
      setMoviesList(moviesData);
      setUsingMockData(mockUsed);
    } catch (err) {
      console.error('Content fetch error:', err);
      if (CMS_DEV_MODE) console.log('[CMS_DEV_MODE] Content fetch failed, using mock data');

      // Last resort: use mock data
      if (USE_MOCK_CONTENT) {
        setSeriesList(MOCK_SERIES);
        setMoviesList(MOCK_MOVIES);
        setUsingMockData(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    setTab(location.pathname.includes('/movies') ? 'movies' : 'series');
  }, [location.pathname]);

  const safeSeries = Array.isArray(seriesList) ? seriesList : [];
  const safeMovies = Array.isArray(moviesList) ? moviesList : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.08em', marginBottom: 4, color: 'var(--text-primary)' }}>
          CONTENT <span style={{ color: 'var(--accent)' }}>MANAGEMENT</span>
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage all your series, seasons, episodes and movies.</p>
        {usingMockData && CMS_DEV_MODE && (
          <div style={{
            marginTop: 8, background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)',
            borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <AlertTriangle size={11} /> Dev mode: showing mock data — backend integration pending
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'series'} onClick={() => setTab('series')} icon={Tv} label="Series" count={safeSeries.length} />
        <TabBtn active={tab === 'movies'} onClick={() => setTab('movies')} icon={Film} label="Movies" count={safeMovies.length} />
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading content...</div>
        ) : (
          <>
            {tab === 'series' && <SeriesTab seriesList={safeSeries} onRefresh={fetchAll} />}
            {tab === 'movies' && <MoviesTab moviesList={safeMovies} onRefresh={fetchAll} />}
          </>
        )}
      </div>
    </div>
  );
}
