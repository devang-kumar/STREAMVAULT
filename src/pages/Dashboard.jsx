import { useState, useEffect, useCallback } from 'react';
import {
  Tv, Film, Users as UsersIcon, Eye, TrendingUp, Clock,
  Plus, ArrowUpRight, Activity, Zap, Globe, BarChart3,
  ChevronRight, Play, Film as FilmIcon, Star
} from 'lucide-react';
import { Card, Badge } from '../components/admin/ui';
import { adminGetStats, getHealth } from '../api/client';
import { getSeries, getMovies } from '../lib/api/cms';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, icon: Icon, color, trend, trendLabel, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = color + '60';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.08em', fontWeight: 600,
        }}>
          {label}
        </span>
        <div style={{
          width: 36, height: 36,
          background: color + '15',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 700,
        color: color, lineHeight: 1,
      }}>
        {value}
      </div>
      {trend !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginTop: 10, fontSize: 11,
          color: trend >= 0 ? 'var(--green)' : 'var(--red)',
        }}>
          <TrendingUp size={12} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
          <span style={{ fontWeight: 600 }}>{Math.abs(trend)}%</span>
          <span style={{ color: 'var(--text-muted)' }}>{trendLabel || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, description, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        textAlign: 'left',
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
      <div style={{
        width: 40, height: 40,
        background: color + '15',
        borderRadius: 'var(--radius)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
      </div>
      <ChevronRight size={16} color="var(--text-muted)" />
    </button>
  );
}

function RecentItem({ icon: Icon, title, subtitle, status, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.15s ease',
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 34, height: 34,
        background: (color || 'var(--accent)') + '15',
        borderRadius: 'var(--radius)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={15} color={color || 'var(--accent)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
          {subtitle}
        </div>
      </div>
      {status && <Badge status={status} />}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSeries: 0, totalMovies: 0, totalEpisodes: 0, totalUsers: 0
  });
  const [recentSeries, setRecentSeries] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [platformHealth, setPlatformHealth] = useState({ ok: false, mongodb: 'unknown' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [seriesData, moviesData, adminData, healthData] = await Promise.allSettled([
        getSeries({ limit: 10 }),
        getMovies({ limit: 10 }),
        adminGetStats().catch(() => null),
        getHealth().catch(() => null),
      ]);

      const series = seriesData.status === 'fulfilled' ? (seriesData.value?.data || []) : [];
      const movies = moviesData.status === 'fulfilled' ? (moviesData.value?.data || []) : [];
      const adminStats = adminData.status === 'fulfilled' ? adminData.value : null;
      const health = healthData.status === 'fulfilled' ? healthData.value : null;

      setRecentSeries(series.slice(0, 6));
      setRecentMovies(movies.slice(0, 6));
      setStats({
        totalSeries: adminStats?.totalSeries ?? series.length,
        totalMovies: adminStats?.totalMovies ?? movies.length,
        totalEpisodes: adminStats?.totalEpisodes ?? series.reduce((acc, s) => acc + (s.episodeCount || 0), 0),
        totalUsers: adminStats?.totalUsers || 0,
        userGrowth: adminStats?.userGrowth,
        episodeGrowth: adminStats?.episodeGrowth,
      });
      setPlatformHealth({
        ok: health?.ok === true && health?.mongodb === 'connected',
        mongodb: health?.mongodb || 'unknown',
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getGreeting = () => {
    const hour = lastUpdated.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { label: 'Total Series', value: stats.totalSeries, icon: Tv, color: '#f5c518', onClick: () => navigate('/admin/content/series') },
    { label: 'Total Movies', value: stats.totalMovies, icon: Film, color: '#3b82f6', onClick: () => navigate('/admin/content/movies') },
    { label: 'Total Episodes', value: stats.totalEpisodes, icon: Eye, color: '#22c55e', trend: stats.episodeGrowth, trendLabel: 'watch activity' },
    { label: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: '#f97316', trend: stats.userGrowth, trendLabel: 'this month', onClick: () => navigate('/admin/users') },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 400, flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32,
          letterSpacing: '0.06em', lineHeight: 1.1,
          color: 'var(--text-primary)',
        }}>
          {getGreeting()}, <span style={{ color: 'var(--accent)' }}>Admin</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Here's what's happening with your platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        {statCards.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Zap size={16} color="var(--accent)" />
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 12,
        }}>
          <QuickAction
            icon={Plus}
            label="Add New Series"
            description="Create a new TV series entry"
            color="#f5c518"
            onClick={() => navigate('/admin/content/series')}
          />
          <QuickAction
            icon={Film}
            label="Add New Movie"
            description="Upload a new movie"
            color="#3b82f6"
            onClick={() => navigate('/admin/content/movies')}
          />
          <QuickAction
            icon={UsersIcon}
            label="Manage Users"
            description="View and manage user accounts"
            color="#f97316"
            onClick={() => navigate('/admin/users')}
          />
          <QuickAction
            icon={BarChart3}
            label="View Analytics"
            description="Platform performance metrics"
            color="#22c55e"
            onClick={() => navigate('/admin/analytics')}
          />
        </div>
      </div>

      {/* Content Grid - Recent Series & Movies */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        {/* Recent Series */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 18px 14px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tv size={15} color="var(--accent)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Series</span>
            </div>
            <button
              onClick={() => navigate('/admin/content/series')}
              style={{
                fontSize: 11, color: 'var(--accent)', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              View All <ArrowUpRight size={11} />
            </button>
          </div>
          {recentSeries.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              No series yet. Add your first series to get started.
            </div>
          ) : (
            recentSeries.map(s => (
              <RecentItem
                key={s.id}
                icon={Tv}
                title={s.title}
                subtitle={`${s.seasons || 0} season${(s.seasons || 0) !== 1 ? 's' : ''} • ${s.episodeCount || 0} episodes`}
                status={s.status === 'published' ? 'Published' : s.status === 'draft' ? 'Draft' : 'Archived'}
                color="#f5c518"
              />
            ))
          )}
        </div>

        {/* Recent Movies */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 18px 14px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Film size={15} color="#3b82f6" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Movies</span>
            </div>
            <button
              onClick={() => navigate('/admin/content/movies')}
              style={{
                fontSize: 11, color: '#3b82f6', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              View All <ArrowUpRight size={11} />
            </button>
          </div>
          {recentMovies.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              No movies yet. Add your first movie to get started.
            </div>
          ) : (
            recentMovies.map(m => (
              <RecentItem
                key={m.id}
                icon={Film}
                title={m.title}
                subtitle={`${m.durationMinutes || m.duration || '-'} min`}
                status={m.status === 'published' ? 'Published' : m.status === 'draft' ? 'Draft' : 'Archived'}
                color="#3b82f6"
              />
            ))
          )}
        </div>
      </div>

      {/* Platform Health Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Activity size={15} color="var(--green)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Platform Status</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          background: platformHealth.ok ? 'var(--green-dim)' : 'var(--red-dim)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11, fontWeight: 600,
          color: platformHealth.ok ? 'var(--green)' : 'var(--red)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: platformHealth.ok ? 'var(--green)' : 'var(--red)',
          }} />
          {platformHealth.ok ? 'All Systems Operational' : 'Service Degraded'}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: 'var(--text-muted)',
        }}>
          <Globe size={12} />
          MongoDB: {platformHealth.mongodb}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: 'var(--text-muted)',
        }}>
          <Clock size={12} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}