import React from 'react';
import {
  LayoutDashboard, Film, Users, Tag, BarChart2,
  Settings, Play, Home, ChevronLeft, ChevronRight,
  Tv, Shield, CreditCard, DollarSign, Activity, Clock, FileText
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { id: 'content', icon: Play, label: 'Content', path: '/admin/content/series' },
  { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
  { id: 'plans', icon: CreditCard, label: 'Plans', path: '/admin/plans' },
  { id: 'categories', icon: Tag, label: 'Categories', path: '/admin/categories' },
  { id: 'pages', icon: FileText, label: 'Pages', path: '/admin/pages' },
  { id: 'revenue', icon: DollarSign, label: 'Revenue', path: '/admin/revenue' },
  { id: 'activity', icon: Activity, label: 'Activity', path: '/admin/activity' },
  { id: 'engagement', icon: Clock, label: 'Engagement', path: '/admin/engagement' },
  { id: 'analytics', icon: BarChart2, label: 'Analytics', path: '/admin/analytics' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const NAV_BOTTOM = [
  { id: 'home', icon: Home, label: 'Back to Home', path: '/' },
];

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    if (path.includes('/admin/content')) return 'content';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/plans')) return 'plans';
    if (path.includes('/admin/pages')) return 'pages';
    if (path.includes('/admin/revenue')) return 'revenue';
    if (path.includes('/admin/activity')) return 'activity';
    if (path.includes('/admin/engagement')) return 'engagement';
    if (path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const activeKey = getActiveKey();
  const isCollapsed = collapsed || false;

  const handleNav = (item) => {
    navigate(item.path);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activeKey === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleNav(item)}
        title={isCollapsed ? item.label : undefined}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center',
          gap: isCollapsed ? 0 : 12,
          padding: isCollapsed ? '11px 0' : '11px 14px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          color: isActive ? '#000' : 'var(--text-secondary)',
          background: isActive ? 'var(--accent)' : 'transparent',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-body)',
          fontWeight: isActive ? 600 : 400,
          fontSize: 13,
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: 2,
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'var(--accent-subtle)';
            e.currentTarget.style.color = 'var(--accent)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        <Icon size={18} style={{ flexShrink: 0 }} />
        {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: isCollapsed ? '20px 0' : '20px 20px',
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)',
        minHeight: 64,
        flexShrink: 0,
      }}>
        {isCollapsed ? (
          <div
            onClick={() => navigate('/')}
            style={{
              width: 34, height: 34,
              background: 'var(--accent)',
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Play size={16} color="#000" fill="#000" />
          </div>
        ) : (
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'var(--accent)',
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Play size={16} color="#000" fill="#000" />
            </div>
            <div style={{ lineHeight: 1 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 20,
                letterSpacing: '0.1em', color: 'var(--text-primary)',
                display: 'block',
              }}>
                STREAM<span style={{ color: 'var(--accent)' }}>VAULT</span>
              </span>
              <span style={{
                fontSize: 9, color: 'var(--text-muted)',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                Admin Panel
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!isCollapsed && (
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            padding: '0 14px', marginBottom: 8,
          }}>
            Menu
          </div>
        )}
        {NAV.map(renderNavItem)}
      </nav>

      {/* Bottom nav */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 10px',
        flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            padding: '0 14px', marginBottom: 8,
          }}>
            Quick Access
          </div>
        )}
        {NAV_BOTTOM.map(renderNavItem)}

        {/* Collapse toggle - desktop only */}
        <button
          onClick={onToggle}
          className="hidden lg:flex"
          style={{
            width: '100%',
            alignItems: 'center', justifyContent: 'center',
            gap: 8,
            padding: '10px 0',
            marginTop: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: 11, fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Scrollbar styles */}
      <style>{`
        nav::-webkit-scrollbar { width: 3px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>
    </aside>
  );
}