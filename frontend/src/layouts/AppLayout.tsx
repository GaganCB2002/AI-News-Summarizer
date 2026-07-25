import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Compass,
  BarChart2,
  FileText,
  Archive,
  Settings,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  ChevronDown,
  Bookmark,
  History,
  Shield,
} from 'lucide-react';
import { getImageUrl } from '../config';
import './AppLayout.css';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, navigate]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="app-layout">
      <header className="app-top-header">
        <div className="top-header-content">
          <Link to="/dashboard" className="logo">
            <span className="logo-text">BrieflyAI</span>
          </Link>

          <nav className="top-nav-links">
            <Link to="/discover" className={`top-nav-link ${isActive('/discover') ? 'active' : ''}`}>
              <Compass size={16} /> Discover
            </Link>
            <Link to="/analytics" className={`top-nav-link ${isActive('/analytics') ? 'active' : ''}`}>
              <BarChart2 size={16} /> Analytics
            </Link>
            <Link to="/summaries" className={`top-nav-link ${isActive('/summaries') ? 'active' : ''}`}>
              <FileText size={16} /> Summaries
            </Link>
            <Link to="/archive" className={`top-nav-link ${isActive('/archive') ? 'active' : ''}`}>
              <Archive size={16} /> Archive
            </Link>
            <Link to="/bookmarks" className={`top-nav-link ${isActive('/bookmarks') ? 'active' : ''}`}>
              <Bookmark size={16} /> Bookmarks
            </Link>
            <Link to="/history" className={`top-nav-link ${isActive('/history') ? 'active' : ''}`}>
              <History size={16} /> History
            </Link>

            <div className="settings-dropdown" ref={settingsRef}>
              <button
                className={`top-nav-link settings-trigger ${settingsOpen ? 'active' : ''}`}
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <Settings size={16} /> SETTINGS <ChevronDown size={14} />
              </button>
              {settingsOpen && (
                <div className="dropdown-menu">
                  <Link to="/settings" className="dropdown-item" onClick={() => setSettingsOpen(false)}>
                    <Settings size={16} /> Preferences
                  </Link>
                  <Link to="/help" className="dropdown-item" onClick={() => setSettingsOpen(false)}>
                    <HelpCircle size={16} /> Help Center
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="top-header-right">
            <form className="search-bar" onSubmit={handleSearch}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="user-profile-wrapper" ref={profileRef}>
              <button
                className="user-profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                title="Profile"
              >
                {user?.profile_image_url ? (
                  <img
                    src={getImageUrl(user.profile_image_url) || ''}
                    alt={user.username}
                    className="user-avatar-img"
                  />
                ) : (
                  <div className="user-avatar-sm" style={{ backgroundColor: '#633cf7' }}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={14} className={`profile-chevron ${profileOpen ? 'open' : ''}`} />
              </button>
              {profileOpen && (
                <div className="profile-dropdown-menu">
                  <Link to="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <Settings size={16} /> Settings
                  </Link>
                  <Link to="/help" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <HelpCircle size={16} /> Help Center
                  </Link>
                  {user?.is_superuser && (
                    <>
                      <div className="dropdown-divider" />
                      <Link to="/admin" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                        <Shield size={16} /> Admin Panel
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout-dropdown-item" onClick={() => { setProfileOpen(false); logout(); }}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      <div className={`mobile-overlay ${mobileMenuOpen ? 'visible' : ''}`} onClick={closeMobileMenu} />
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <span className="logo-text">BrieflyAI</span>
          <button onClick={closeMobileMenu} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <nav className="mobile-nav-links">
          <Link to="/discover" className="mobile-nav-link" onClick={closeMobileMenu}><Compass size={18} /> Discover</Link>
          <Link to="/analytics" className="mobile-nav-link" onClick={closeMobileMenu}><BarChart2 size={18} /> Analytics</Link>
          <Link to="/summaries" className="mobile-nav-link" onClick={closeMobileMenu}><FileText size={18} /> Summaries</Link>
          <Link to="/archive" className="mobile-nav-link" onClick={closeMobileMenu}><Archive size={18} /> Archive</Link>
          <Link to="/bookmarks" className="mobile-nav-link" onClick={closeMobileMenu}><Bookmark size={18} /> Bookmarks</Link>
          <Link to="/history" className="mobile-nav-link" onClick={closeMobileMenu}><History size={18} /> History</Link>
          <div className="mobile-nav-divider">SETTINGS</div>
          <Link to="/settings" className="mobile-nav-link" onClick={closeMobileMenu}><Settings size={18} /> Preferences</Link>
          <Link to="/help" className="mobile-nav-link" onClick={closeMobileMenu}><HelpCircle size={18} /> Help Center</Link>
          {user?.is_superuser && (
            <Link to="/admin" className="mobile-nav-link" onClick={closeMobileMenu}><Shield size={18} /> Admin Panel</Link>
          )}
        </nav>
        <div className="mobile-nav-footer">
          <div className="user-profile glass-panel">
            {user?.profile_image_url ? (
              <img
                src={getImageUrl(user.profile_image_url) || ''}
                alt={user.username}
                className="user-avatar-img mobile-avatar-img"
              />
            ) : (
              <div className="user-avatar" style={{ backgroundColor: '#633cf7' }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="user-info">
              <div className="user-name">{user?.username || 'User'}</div>
              <div className="user-type">Member</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;