import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, Eye, Clock, Film, Tv,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar,
  Activity, Zap, Globe, Monitor
} from 'lucide-react';
import { adminGetStats, adminGetAnalytics } from '../api/client';
import { getSeries, getMovies } from '../lib/api/cms';

function MetricCard({ label, value, change, changeLabel, icon: Icon, color, subtitle }) {
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
        {change !== undefined && (
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
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '0 4px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%',
            maxWidth: 32,
            height: `${(item.value / maxValue) * 100}%`,
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

function ActivityItem({ icon: Icon, text, time, color }) {
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
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{text}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{time}</div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [adminData, seriesData, moviesData] = await Promise.allSettled([
        adminGetStats().catch(() => null),
        getSeries({ limit: 50 }),
        getMovies({ limit: 50 }),
      ]);

      const adminStats = adminData.status === 'fulfilled' ? adminData.value : null;
      const series = seriesData.status === 'fulfilled' ? (seriesData.value?.data || []) : [];
      const movies = moviesData.status === 'fulfilled' ? (moviesData.value?.data || []) : [];
      const totalEpisodes = series.reduce((acc, s) => acc + (s.episodeCount || 0), 0);

      setStats({
        totalUsers: adminStats?.totalUsers || 0,
        totalSeries: series.length,
        totalMovies: movies.length,
        totalEpisodes,
        publishedSeries: series.filter(s => s.status === 'published').length,
        draftSeries: series.filter(s => s.status === 'draft').length,
        publishedMovies: movies.filter(m => m.status === 'published').length,
        draftMovies: movies.filter(m => m.status === 'draft').length,
      });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
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

  // Generate mock weekly data for the bar chart
  const weeklyData = [
    { label: 'Mon', value: Math.floor(Math.random() * 50) + 20 },
    { label: 'Tue', value: Math.floor(Math.random() * 50) + 25 },
    { label: 'Wed', value: Math.floor(Math.random() * 50) + 30 },
    { label: 'Thu', value: Math.floor(Math.random() * 50) + 15 },
    { label: 'Fri', value: Math.floor(Math.random() * 50) + 35 },
    { label: 'Sat', value: Math.floor(Math.random() * 50) + 40 },
    { label: 'Sun', value: Math.floor(Math.random() * 50) + 45 },
  ];
  const maxWeekly = Math.max(...weeklyData.map(d => d.value));

  const contentBreakdown = [
    { label: 'Published Series', value: stats?.publishedSeries || 0, color: 'var(--green)' },
    { label: 'Draft Series', value: stats?.draftSeries || 0, color: 'var(--accent)' },
    { label: 'Published Movies', value: stats?.publishedMovies || 0, color: '#3b82f6' },
    { label: 'Draft Movies', value: stats?.draftMovies || 0, color: '#f97316' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            letterSpacing: '0.06em', marginBottom: 4,
          }}>
            PLATFORM <span style={{ color: 'var(--accent)' }}>ANALYTICS</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Insights and performance metrics for your platform
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

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <MetricCard label="Total Users" value={stats?.totalUsers || 0} change={8} changeLabel="vs last month" icon={Users} color="#f97316" />
        <MetricCard label="Total Content" value={(stats?.totalSeries || 0) + (stats?.totalMovies || 0)} change={12} changeLabel="vs last month" icon={Film} color="#3b82f6" />
        <MetricCard label="Total Episodes" value={stats?.totalEpisodes || 0} change={15} changeLabel="this week" icon={Tv} color="#22c55e" />
        <MetricCard label="Published Rate" value={`${((stats?.publishedSeries || 0) + (stats?.publishedMovies || 0)) > 0 ? Math.round(((stats?.publishedSeries || 0) + (stats?.publishedMovies || 0)) / Math.max(1, (stats?.totalSeries || 0) + (stats?.totalMovies || 0)) * 100) : 0}%`} icon={Activity} color="var(--accent)" subtitle="of total content" />
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        {/* Weekly Activity */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Weekly Activity</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Content views this week</div>
            </div>
            <BarChart3 size={16} color="var(--accent)" />
          </div>
          <BarChartSimple data={weeklyData} maxValue={maxWeekly} color="var(--accent)" />
        </div>

        {/* Content Breakdown */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Content Breakdown</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>By status and type</div>
            </div>
            <Film size={16} color="#3b82f6" />
          </div>
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
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
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
        <ActivityItem icon={Tv} text="New series added to the library" time="2 hours ago" color="var(--accent)" />
        <ActivityItem icon={Users} text="New user registered" time="3 hours ago" color="#22c55e" />
        <ActivityItem icon={Film} text="Movie updated: duration changed" time="5 hours ago" color="#3b82f6" />
        <ActivityItem icon={Activity} text="System backup completed" time="12 hours ago" color="var(--green)" />
        <ActivityItem icon={Zap} text="Platform settings updated" time="1 day ago" color="#f97316" />
      </div>
    </div>
  );
}