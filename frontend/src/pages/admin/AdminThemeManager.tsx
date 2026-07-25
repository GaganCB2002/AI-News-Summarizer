import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { CheckCircle, AlertCircle, Palette } from 'lucide-react';
import './AdminThemeManager.css';

type ThemePreset = 'modern-glass' | 'professional' | 'news-magazine';

interface ThemeConfig {
  preset: ThemePreset;
  primary_color: string;
  accent_color: string;
  font_family: string;
  card_radius: number;
  animations_enabled: boolean;
  dark_mode_default: boolean;
}

const presetDefaults: Record<ThemePreset, Partial<ThemeConfig>> = {
  'modern-glass': {
    primary_color: '#0e5ef5',
    accent_color: '#633cf7',
    font_family: "'Inter', system-ui, -apple-system, sans-serif",
    card_radius: 16,
    animations_enabled: true,
    dark_mode_default: false,
  },
  'professional': {
    primary_color: '#2563eb',
    accent_color: '#7c3aed',
    font_family: "'Inter', system-ui, -apple-system, sans-serif",
    card_radius: 8,
    animations_enabled: false,
    dark_mode_default: false,
  },
  'news-magazine': {
    primary_color: '#b91c1c',
    accent_color: '#1e3a5f',
    font_family: "'Merriweather', Georgia, serif",
    card_radius: 4,
    animations_enabled: false,
    dark_mode_default: true,
  },
};

const fontOptions = [
  { value: "'Inter', system-ui, -apple-system, sans-serif", label: 'Inter (Sans-serif)' },
  { value: "'Merriweather', Georgia, serif", label: 'Merriweather (Serif)' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display' },
];

const AdminThemeManager: React.FC = () => {
  useDocumentTitle('Theme Manager');
  const { user, isLoading: authLoading } = useAuth();
  const [config, setConfig] = useState<ThemeConfig>({
    preset: 'modern-glass',
    primary_color: '#0e5ef5',
    accent_color: '#633cf7',
    font_family: "'Inter', system-ui, -apple-system, sans-serif",
    card_radius: 16,
    animations_enabled: true,
    dark_mode_default: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const saved = localStorage.getItem('admin_theme_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        setIsLoading(false);
        return;
      } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const applyConfig = useCallback((cfg: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', cfg.primary_color);
    root.style.setProperty('--color-primary-hover', cfg.primary_color + 'cc');
    root.style.setProperty('--color-secondary', cfg.accent_color);
    root.style.setProperty('--color-secondary-hover', cfg.accent_color + 'cc');
    root.style.setProperty('--font-primary', cfg.font_family);
    root.style.setProperty('--radius-sm', `${Math.round(cfg.card_radius * 0.3)}px`);
    root.style.setProperty('--radius-md', `${Math.round(cfg.card_radius * 0.6)}px`);
    root.style.setProperty('--radius-lg', `${cfg.card_radius}px`);

    const darkMode = cfg.dark_mode_default;
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

    const metaAnimate = document.querySelector('meta[name="animations-enabled"]');
    if (!metaAnimate) {
      const meta = document.createElement('meta');
      meta.name = 'animations-enabled';
      meta.content = cfg.animations_enabled ? 'true' : 'false';
      document.head.appendChild(meta);
    } else {
      metaAnimate.setAttribute('content', cfg.animations_enabled ? 'true' : 'false');
    }
  }, []);

  const selectPreset = (preset: ThemePreset) => {
    const defaults = presetDefaults[preset];
    const newConfig = { ...config, ...defaults, preset };
    setConfig(newConfig);
    applyConfig(newConfig);
  };

  const updateConfig = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    applyConfig(newConfig);
  };

  const handleApply = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post('/admin/theme', config);
      localStorage.setItem('admin_theme_config', JSON.stringify(config));
      setMessage('Theme applied successfully!');
      setMessageType('success');
    } catch {
      localStorage.setItem('admin_theme_config', JSON.stringify(config));
      setMessage('Theme saved locally. Could not sync with server.');
      setMessageType('success');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user?.is_superuser) return <Navigate to="/login" />;

  return (
    <div className="admin-theme-page">
      <h1>Theme Manager</h1>

      {message && (
        <div className={`settings-message-banner ${messageType}`}>
          {messageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-skeleton" style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-lg)' }} />
          <div className="admin-skeleton" style={{ width: '100%', height: '200px', borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : (
        <>
          <div className="admin-settings-section glass-panel">
            <h3>Theme Presets</h3>
            <p className="text-muted" style={{ marginBottom: '1.25rem' }}>Choose a predefined theme style.</p>
            <div className="theme-preset-grid">
              {(['modern-glass', 'professional', 'news-magazine'] as ThemePreset[]).map((preset) => (
                <div
                  key={preset}
                  className={`theme-preset-card glass-panel ${config.preset === preset ? 'selected' : ''}`}
                  onClick={() => selectPreset(preset)}
                >
                  <h3>{preset === 'modern-glass' ? 'Modern Glass' : preset === 'professional' ? 'Professional Dashboard' : 'News Magazine'}</h3>
                  <p>
                    {preset === 'modern-glass' ? 'Frosted glass surfaces with vibrant gradients and smooth animations.' :
                     preset === 'professional' ? 'Clean minimal design with subtle shadows and crisp typography.' :
                     'Editorial dark theme with serif fonts and classic layout.'}
                  </p>
                  <div className={`theme-preview-box ${preset}`}>
                    <div className="preview-bar preview-bar-lg" style={{ backgroundColor: preset === 'news-magazine' ? '#b91c1c' : preset === 'professional' ? '#2563eb' : '#0e5ef5' }} />
                    <div className="preview-bar preview-bar-sm" style={{ backgroundColor: preset === 'news-magazine' ? '#1e3a5f' : preset === 'professional' ? '#7c3aed' : '#633cf7' }} />
                    <div className="preview-bar preview-bar-sm" style={{ width: '40%', backgroundColor: 'rgba(128,128,128,0.3)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="theme-customize-section">
            <div className="theme-customize-card glass-panel">
              <h3><Palette size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Colors</h3>
              <div className="color-picker-group">
                <label>Primary Color</label>
                <div className="color-picker-row">
                  <input type="color" value={config.primary_color} onChange={e => updateConfig('primary_color', e.target.value)} />
                  <input type="text" className="color-hex-input" value={config.primary_color} onChange={e => updateConfig('primary_color', e.target.value)} />
                </div>
              </div>
              <div className="color-picker-group">
                <label>Accent Color</label>
                <div className="color-picker-row">
                  <input type="color" value={config.accent_color} onChange={e => updateConfig('accent_color', e.target.value)} />
                  <input type="text" className="color-hex-input" value={config.accent_color} onChange={e => updateConfig('accent_color', e.target.value)} />
                </div>
              </div>
              <div className="font-selector">
                <label>Font Family</label>
                <select value={config.font_family} onChange={e => updateConfig('font_family', e.target.value)}>
                  {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>

            <div className="theme-customize-card glass-panel">
              <h3>Layout & Effects</h3>
              <div className="radius-slider-group">
                <label>Card Radius: <span className="radius-value">{config.card_radius}px</span></label>
                <input type="range" min={0} max={32} value={config.card_radius} onChange={e => updateConfig('card_radius', Number(e.target.value))} />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Animations</h4>
                  <p>Enable transition effects and micro-animations.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={config.animations_enabled} onChange={e => updateConfig('animations_enabled', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Dark Mode Default</h4>
                  <p>New visitors will see dark mode by default.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={config.dark_mode_default} onChange={e => updateConfig('dark_mode_default', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          <div className="theme-live-preview glass-panel">
            <h3>Live Preview</h3>
            <div className="live-preview-card glass-panel">
              <h4 style={{ fontFamily: config.font_family }}>Sample Card</h4>
              <p>This is how your cards will look with the current theme settings. Adjust colors and radius above.</p>
              <div className="live-preview-buttons">
                <button className="live-preview-btn primary">Primary</button>
                <button className="live-preview-btn secondary">Secondary</button>
                <button className="live-preview-btn outline">Outline</button>
              </div>
            </div>
          </div>

          <div className="theme-apply-section">
            <Button variant="primary" onClick={handleApply} disabled={saving}>
              <Palette size={16} />{saving ? 'Applying...' : 'Apply Theme'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminThemeManager;
