import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  dashboard: 'Dashboard',
  content: 'Content Management',
  users: 'Users',
  categories: 'Categories',
  analytics: 'Analytics',
  settings: 'Settings',
};

const pageSubtitles = {
  dashboard: 'Overview of your platform',
  content: 'Manage series, movies & episodes',
  users: 'Manage user accounts & roles',
  categories: 'Organize content by genre & tags',
  analytics: 'Platform usage & performance',
  settings: 'System configuration',
};

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    if (path.includes('/admin/content')) return 'content';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const activePage = getActivePage();
  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen, isDesktop]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className="admin-sidebar-container"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          width: sidebarWidth,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Mobile sidebar - overlay drawer, slides in from left */}
      <div
        className="admin-sidebar-mobile"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
          width: 260,
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: mobileSidebarOpen ? 'auto' : 'none',
        }}
      >
        <AdminSidebar
          collapsed={false}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div
        className="admin-main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          marginLeft: isDesktop ? sidebarWidth : 0,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Topbar */}
        <header
          style={{
            height: 64,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            gap: 16,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Mobile menu button - hidden on desktop (lg+), visible on mobile/tablet */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex lg:hidden items-center justify-center"
            style={{
              width: 36, height: 36,
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              borderRadius: 'var(--radius)', cursor: 'pointer',
              border: '1px solid var(--border)',
              flexShrink: 0,
            }}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          {/* Page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.2,
            }}>
              {pageTitles[activePage] || ''}
            </h1>
            <p style={{
              fontSize: 11, color: 'var(--text-muted)',
              marginTop: 1, letterSpacing: '0.02em',
            }}>
              {pageSubtitles[activePage] || ''}
            </p>
          </div>

          {/* Right side - just admin badge, no notification/profile buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-subtle)',
              border: '1px solid rgba(245,197,24,0.2)',
              borderRadius: 'var(--radius)',
              padding: '5px 12px',
              fontSize: 11, fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)',
              }} />
              ADMIN
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1, overflow: 'auto',
          padding: '28px',
          background: 'var(--bg-base)',
        }}>
          {children}
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1023px) {
          .admin-sidebar-container { display: none !important; }
          .admin-main-content { margin-left: 0 !important; }
        }
        @media (min-width: 1024px) {
          .admin-sidebar-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}