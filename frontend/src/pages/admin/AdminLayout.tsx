import type React from 'react';
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, Settings, Palette, FileText,
  ChevronRight, Home, ArrowLeft, Menu, Shield,
} from 'lucide-react';
import './AdminLayout.css';

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  settings: 'Settings',
  theme: 'Theme Manager',
  content: 'Content',
};

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentPage = pathSegments[pathSegments.length - 1] || 'dashboard';
  const pageTitle = breadcrumbMap[currentPage] || 'Admin';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/admin/users', icon: <Users size={18} />, label: 'Users' },
    { path: '/admin/content', icon: <FileText size={18} />, label: 'Content' },
    { path: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
    { path: '/admin/theme', icon: <Palette size={18} />, label: 'Theme' },
  ];

  if (!user?.is_superuser) {
    return null;
  }

  return (
    <div className="admin-layout">
      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="logo-icon">A</div>
          <div>
            <div className="sidebar-title">BrieflyAI</div>
            <div className="sidebar-subtitle">Admin Panel</div>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-label">Management</div>
          {navItems.map((item) => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/dashboard" className="admin-sidebar-back">
            <ArrowLeft size={16} /> Back to App
          </Link>
        </div>
      </aside>

      <div className="admin-main-area">
        <header className="admin-header">
          <button className="admin-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="admin-header-breadcrumbs">
            <Link to="/dashboard" className="admin-breadcrumb-link"><Home size={14} /></Link>
            <ChevronRight size={12} />
            <span className="admin-breadcrumb-current">{pageTitle}</span>
          </div>
          <div className="admin-header-right">
            <div className="admin-header-user">
              <Shield size={14} />
              <span>{user?.username}</span>
            </div>
          </div>
        </header>
        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
