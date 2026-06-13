import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, Film, Tv, Play,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Activity, Clock
} from 'lucide-react';
import { adminGetAnalytics } from '../api/client';
import { getSeries, getMovies } from '../lib/api/cms';

function MetricCard({ label, value, change, icon: Icon, color, subtitle }) {
  const isPositive = change >= 0;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80,
        background: `radial-gradient(circle, ${color}08, transparent 70%)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36,
          background: color + '15',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={color} />
        </div>
        {change !== undefined && change !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 600,
            color: isPositive ? 'var(--green)' : 'var(--red)',
            background: isPositive ? 'var(--green-dim)' : 'var(--red-dim)',
            padding: '3px 8px', borderRadius: 99,
          }}>
            {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700,
        color: 'var(--text-primary)', lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function BarChartSimple({ data, maxValue, color }) {
  const max = maxValue || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '0 4px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%',
            maxWidth: 32,
            height: `${(item.value / max) * 100}%`,
            minHeight: 4,
            background: `linear-gradient(to top, ${color}40, ${color})`,
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ icon: Icon, text, time, color, userName }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 30, height: 30,
        background: (color || 'var(--accent)') + '15',
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <Icon size={13} color={color || 'var(--accent)'} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {text}
          {userName && <span style={{ color: 'var(--text-muted)' }}> — {userName}</span>}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{time}</div>
      </div>
    </div>
  );
}

const EVENT_ICON = {
  login: Users,
  register: Users,
  watch: Tv,
  watch_start: Play,
  watch_complete: Tv,
  subscribe: Activity,
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsData, seriesData, moviesData] = await Promise.allSettled([
        adminGetAnalytics(),
        getSeries({ limit: 100 }),
        getMovies({ limit: 100 }),
      ]);

      const analyticsRes = analyticsData.status === 'fulfilled' ? analyticsData.value : null;
      const series = seriesData.status === 'fulfilled' ? (seriesData.value?.data || []) : [];
      const movies = moviesData.status === 'fulfilled' ? (moviesData.value?.data || []) : [];
      const totalEpisodes = series.reduce((acc, s) => acc + (s.episodeCount || 0), 0);

      setAnalytics(analyticsRes);
      setStats({
        totalUsers: analyticsRes?.totalUsers || 0,
        totalSeries: series.length,
        totalMovies: movies.length,
        totalEpisodes,
        publishedSeries: series.filter(s => s.status === 'published').length,
        draftSeries: series.filter(s => s.status === 'draft').length,
        publishedMovies: movies.filter(m => m.status === 'published').length,
        draftMovies: movies.filter(m => m.status === 'draft').length,
        metrics: analyticsRes?.metrics || {},
        weeklyActivity: analyticsRes?.weeklyActivity || [],
        recentEvents: analyticsRes?.recentEvents || [],
        topContent: analyticsRes?.topContent || [],
        kpis: analyticsRes?.kpis || [],
      });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading analytics...</div>
      </div>
    );
  }

  const weeklyData = stats?.weeklyActivity?.length
    ? stats.weeklyActivity
    : [{ label: '—', value: 0 }];
  const maxWeekly = Math.max(...weeklyData.map(d => d.value), 1);

  const contentBreakdown = [
    { label: 'Published Series', value: stats?.publishedSeries || 0, color: 'var(--green)' },
    { label: 'Draft Series', value: stats?.draftSeries || 0, color: 'var(--accent)' },
    { label: 'Published Movies', value: stats?.publishedMovies || 0, color: '#3b82f6' },
    { label: 'Draft Movies', value: stats?.draftMovies || 0, color: '#f97316' },
  ];

  const publishedRate = ((stats?.publishedSeries || 0) + (stats?.publishedMovies || 0)) > 0
    ? Math.round(((stats?.publishedSeries || 0) + (stats?.publishedMovies || 0)) / Math.max(1, (stats?.totalSeries || 0) + (stats?.totalMovies || 0)) * 100)
    : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            letterSpacing: '0.06em', marginBottom: 4,
            color: 'var(--text-primary)',
          }}>
            PLATFORM <span style={{ color: 'var(--accent)' }}>ANALYTICS</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Live insights from users, payments, and watch sessions
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <MetricCard label="Total Users" value={stats?.totalUsers || 0} change={stats?.metrics?.userGrowth} icon={Users} color="#f97316" />
        <MetricCard label="Total Content" value={(stats?.totalSeries || 0) + (stats?.totalMovies || 0)} change={stats?.metrics?.contentGrowth} icon={Film} color="#3b82f6" />
        <MetricCard label="Watch Sessions" value={analytics?.kpis?.[0]?.value || stats?.totalEpisodes || 0} change={stats?.metrics?.episodeGrowth} icon={Tv} color="#22c55e" subtitle="This month vs last" />
        <MetricCard label="Published Rate" value={`${publishedRate}%`} icon={Activity} color="var(--accent)" subtitle="of total content" />
      </div>

      {stats?.kpis?.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12, marginBottom: 28,
        }}>
          {stats.kpis.map((kpi) => (
            <div key={kpi.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 18px',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{kpi.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Weekly Activity</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>User events (last 7 days)</div>
            </div>
            <BarChart3 size={16} color="var(--accent)" />
          </div>
          <BarChartSimple data={weeklyData} maxValue={maxWeekly} color="var(--accent)" />
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Top Watched Content</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>By view count</div>
            </div>
            <Film size={16} color="#3b82f6" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(stats?.topContent || []).length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No view data yet</p>
            ) : (
              stats.topContent.map((item, i) => (
                <div key={item.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{i + 1}. {item.title}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>{item.views} views</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Content Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contentBreakdown.map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (item.value / Math.max(1, stats?.totalSeries || stats?.totalMovies || 1)) * 100)}%`,
                    height: '100%',
                    background: item.color,
                    borderRadius: 99,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Latest platform events</div>
            </div>
            <Clock size={16} color="var(--text-muted)" />
          </div>
          {(stats?.recentEvents || []).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No activity recorded yet. Events appear when users watch, login, or subscribe.</p>
          ) : (
            stats.recentEvents.map((ev, i) => (
              <ActivityItem
                key={`${ev.event}-${i}`}
                icon={EVENT_ICON[ev.event] || Activity}
                text={ev.text}
                time={ev.time}
                userName={ev.userName}
                color="var(--accent)"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
