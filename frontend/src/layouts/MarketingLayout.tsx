import type React from 'react';
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Phone, Mail, MapPin, X } from 'lucide-react';
import { Button } from '../components/Button';
import './MarketingLayout.css';

const MarketingLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showContactModal, setShowContactModal] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="marketing-layout">
      <header className="marketing-header glass-panel">
        <div className="marketing-container header-content">
          <Link to="/" className="logo">
            <span className="logo-text">BrieflyAI</span>
          </Link>
          
          <nav className="nav-links">
            <Link to="/discover" className={`nav-link ${isActive('/discover') ? 'active' : ''}`}>Discover</Link>
            <Link to="/analytics" className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}>Analytics</Link>
            <Link to="/summaries" className={`nav-link ${isActive('/summaries') ? 'active' : ''}`}>Summaries</Link>
            <Link to="/archive" className={`nav-link ${isActive('/archive') ? 'active' : ''}`}>Archive</Link>
            <button 
              className="nav-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => setShowContactModal(true)}
            >
              Contact
            </button>
          </nav>
          
          <div className="header-actions">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/login">
              <Button variant="primary" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="marketing-main">
        <Outlet />
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowContactModal(false)}>
          <div style={{
            backgroundColor: 'var(--color-bg-base)',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            width: '90%',
            maxWidth: '450px',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--color-border)'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowContactModal(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)'
              }}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Contact Us</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <Phone size={20} style={{ color: 'var(--color-primary)', marginTop: '0.15rem' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Phone Number</div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>+91 98765 43210</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <Mail size={20} style={{ color: 'var(--color-primary)', marginTop: '0.15rem' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Email Address</div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>contact@brieflyai.com</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <MapPin size={20} style={{ color: 'var(--color-primary)', marginTop: '0.15rem' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Company Address</div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                    100 Innovation Drive<br/>
                    Suite 400<br/>
                    San Francisco, CA 94107
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              fullWidth 
              style={{ marginTop: '2rem' }}
              onClick={() => setShowContactModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingLayout;
