import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../services/api';
import { Button } from '../../components/Button';
import {
  Save, Globe, Server, ToggleLeft, CheckCircle, AlertCircle,
} from 'lucide-react';
import './AdminSettings.css';

interface SiteSettings {
  site_name: string;
  site_logo: string;
  site_favicon: string;
  footer_text: string;
  contact_email: string;
  default_language: string;
  meta_description: string;
}

interface SystemSettings {
  pagination_size: number;
  cache_ttl_seconds: number;
  ai_provider: string;
  ai_model: string;
  news_provider: string;
  news_api_key_set: boolean;
}

interface ToggleSettings {
  maintenance_mode: boolean;
  registration_enabled: boolean;
}

const AdminSettings: React.FC = () => {
  useDocumentTitle('Admin Settings');
  const { user, isLoading: authLoading } = useAuth();

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: 'BrieflyAI',
    site_logo: '',
    site_favicon: '',
    footer_text: '',
    contact_email: '',
    default_language: 'en',
    meta_description: '',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    pagination_size: 20,
    cache_ttl_seconds: 300,
    ai_provider: 'openai',
    ai_model: 'gpt-4',
    news_provider: 'newsapi',
    news_api_key_set: false,
  });

  const [toggles, setToggles] = useState<ToggleSettings>({
    maintenance_mode: false,
    registration_enabled: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [siteRes, systemRes, togglesRes] = await Promise.all([
        api.get('/admin/settings/site').catch(() => ({ data: null })),
        api.get('/admin/settings/system').catch(() => ({ data: null })),
        api.get('/admin/settings/toggles').catch(() => ({ data: null })),
      ]);
      if (siteRes.data) setSiteSettings(prev => ({ ...prev, ...siteRes.data }));
      if (systemRes.data) setSystemSettings(prev => ({ ...prev, ...systemRes.data }));
      if (togglesRes.data) setToggles(prev => ({ ...prev, ...togglesRes.data }));
    } catch {
      // use defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSite(true);
    setMessage('');
    try {
      await api.put('/admin/settings/site', siteSettings);
      setMessage('Site settings saved successfully!');
      setMessageType('success');
    } catch {
      setMessage('Failed to save site settings.');
      setMessageType('error');
    } finally {
      setSavingSite(false);
    }
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSystem(true);
    setMessage('');
    try {
      await api.put('/admin/settings/system', systemSettings);
      setMessage('System settings saved successfully!');
      setMessageType('success');
    } catch {
      setMessage('Failed to save system settings.');
      setMessageType('error');
    } finally {
      setSavingSystem(false);
    }
  };

  const handleToggle = async (key: keyof ToggleSettings, value: boolean) => {
    setToggles(prev => ({ ...prev, [key]: value }));
    setMessage('');
    try {
      await api.put('/admin/settings/toggles', { [key]: value });
      setMessage(`${key === 'maintenance_mode' ? 'Maintenance mode' : 'Registration'} ${value ? 'enabled' : 'disabled'}.`);
      setMessageType('success');
    } catch {
      setToggles(prev => ({ ...prev, [key]: !value }));
      setMessage('Failed to update toggle.');
      setMessageType('error');
    }
  };

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user?.is_superuser) return <Navigate to="/login" />;

  return (
    <div className="admin-settings-page">
      <h1>Settings</h1>

      {message && (
        <div className={`settings-message-banner ${messageType}`}>
          {messageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message}
        </div>
      )}

      {isLoading ? (
        <>
          <div className="glass-panel admin-settings-section">
            <div className="admin-skeleton" style={{ width: '180px', height: '20px', marginBottom: '8px' }} />
            <div className="admin-skeleton" style={{ width: '260px', height: '14px', marginBottom: '24px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}><div className="admin-skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-md)' }} /></div>
              ))}
            </div>
          </div>
          <div className="glass-panel admin-settings-section">
            <div className="admin-skeleton" style={{ width: '180px', height: '20px', marginBottom: '24px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}><div className="admin-skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-md)' }} /></div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="glass-panel admin-settings-section">
            <h3><Globe size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Site Settings</h3>
            <p className="text-muted">Configure site branding and public information.</p>
            <form onSubmit={handleSaveSite} className="admin-settings-form">
              <div className="settings-form-row">
                <div className="settings-field">
                  <label>Site Name</label>
                  <input type="text" value={siteSettings.site_name} onChange={e => setSiteSettings(s => ({ ...s, site_name: e.target.value }))} />
                </div>
                <div className="settings-field">
                  <label>Default Language</label>
                  <select value={siteSettings.default_language} onChange={e => setSiteSettings(s => ({ ...s, default_language: e.target.value }))}>
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>
              <div className="settings-form-row">
                <div className="settings-field">
                  <label>Logo URL</label>
                  <input type="text" value={siteSettings.site_logo} onChange={e => setSiteSettings(s => ({ ...s, site_logo: e.target.value }))} placeholder="/uploads/logo.png" />
                  <span className="settings-field-hint">Path or URL to the site logo.</span>
                </div>
                <div className="settings-field">
                  <label>Favicon URL</label>
                  <input type="text" value={siteSettings.site_favicon} onChange={e => setSiteSettings(s => ({ ...s, site_favicon: e.target.value }))} placeholder="/uploads/favicon.ico" />
                </div>
              </div>
              <div className="settings-field">
                <label>Footer Text</label>
                <textarea value={siteSettings.footer_text} onChange={e => setSiteSettings(s => ({ ...s, footer_text: e.target.value }))} placeholder="© 2026 BrieflyAI. All rights reserved." />
              </div>
              <div className="settings-form-row">
                <div className="settings-field">
                  <label>Contact Email</label>
                  <input type="email" value={siteSettings.contact_email} onChange={e => setSiteSettings(s => ({ ...s, contact_email: e.target.value }))} />
                </div>
                <div className="settings-field">
                  <label>Meta Description</label>
                  <input type="text" value={siteSettings.meta_description} onChange={e => setSiteSettings(s => ({ ...s, meta_description: e.target.value }))} />
                </div>
              </div>
              <div className="admin-settings-actions">
                <Button type="submit" variant="primary" disabled={savingSite}>
                  <Save size={16} />{savingSite ? 'Saving...' : 'Save Site Settings'}
                </Button>
              </div>
            </form>
          </div>

          <div className="glass-panel admin-settings-section">
            <h3><Server size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> System Settings</h3>
            <p className="text-muted">Configure application behavior and integrations.</p>
            <form onSubmit={handleSaveSystem} className="admin-settings-form">
              <div className="settings-form-row">
                <div className="settings-field">
                  <label>Pagination Size</label>
                  <input type="number" min={5} max={100} value={systemSettings.pagination_size} onChange={e => setSystemSettings(s => ({ ...s, pagination_size: Number(e.target.value) }))} />
                  <span className="settings-field-hint">Items per page in lists.</span>
                </div>
                <div className="settings-field">
                  <label>Cache TTL (seconds)</label>
                  <input type="number" min={0} value={systemSettings.cache_ttl_seconds} onChange={e => setSystemSettings(s => ({ ...s, cache_ttl_seconds: Number(e.target.value) }))} />
                  <span className="settings-field-hint">How long to cache data (0 to disable).</span>
                </div>
              </div>
              <div className="settings-form-row">
                <div className="settings-field">
                  <label>AI Provider</label>
                  <select value={systemSettings.ai_provider} onChange={e => setSystemSettings(s => ({ ...s, ai_provider: e.target.value }))}>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google AI</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>AI Model</label>
                  <input type="text" value={systemSettings.ai_model} onChange={e => setSystemSettings(s => ({ ...s, ai_model: e.target.value }))} placeholder="gpt-4" />
                </div>
              </div>
              <div className="settings-form-row">
                <div className="settings-field">
                  <label>News Provider</label>
                  <select value={systemSettings.news_provider} onChange={e => setSystemSettings(s => ({ ...s, news_provider: e.target.value }))}>
                    <option value="newsapi">NewsAPI</option>
                    <option value="gnews">GNews</option>
                    <option value="rss">RSS Feeds</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>News API Key</label>
                  <input type="text" value={systemSettings.news_api_key_set ? '••••••••' : 'Not set'} disabled />
                  <span className="settings-field-hint">Set via environment variable or contact admin.</span>
                </div>
              </div>
              <div className="admin-settings-actions">
                <Button type="submit" variant="primary" disabled={savingSystem}>
                  <Save size={16} />{savingSystem ? 'Saving...' : 'Save System Settings'}
                </Button>
              </div>
            </form>
          </div>

          <div className="glass-panel admin-settings-section">
            <h3><ToggleLeft size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Toggle Controls</h3>
            <p className="text-muted">Enable or disable application features.</p>
            <div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Maintenance Mode</h4>
                  <p>When enabled, only admins can access the site.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={toggles.maintenance_mode} onChange={e => handleToggle('maintenance_mode', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>User Registration</h4>
                  <p>Allow new users to create accounts.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={toggles.registration_enabled} onChange={e => handleToggle('registration_enabled', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSettings;
