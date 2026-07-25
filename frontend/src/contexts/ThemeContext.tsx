import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export type ThemePreset = 'modern-glass' | 'professional' | 'news-magazine';

export interface ThemeConfig {
  preset: ThemePreset;
  primary_color: string;
  accent_color: string;
  font_family: string;
  card_radius: number;
  animations_enabled: boolean;
  dark_mode_default: boolean;
}

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themeConfig: ThemeConfig;
  setThemeConfig: (config: ThemeConfig) => void;
}

const defaultThemeConfig: ThemeConfig = {
  preset: 'modern-glass',
  primary_color: '#0e5ef5',
  accent_color: '#633cf7',
  font_family: "'Inter', system-ui, -apple-system, sans-serif",
  card_radius: 16,
  animations_enabled: true,
  dark_mode_default: false,
};

function applyThemeConfigToDOM(config: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', config.primary_color);
  root.style.setProperty('--color-primary-hover', config.primary_color + 'cc');
  root.style.setProperty('--color-secondary', config.accent_color);
  root.style.setProperty('--color-secondary-hover', config.accent_color + 'cc');
  root.style.setProperty('--font-primary', config.font_family);
  root.style.setProperty('--radius-sm', `${Math.round(config.card_radius * 0.3)}px`);
  root.style.setProperty('--radius-md', `${Math.round(config.card_radius * 0.6)}px`);
  root.style.setProperty('--radius-lg', `${config.card_radius}px`);

  const savedTheme = localStorage.getItem('theme');
  root.setAttribute('data-theme', savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light');
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const configSaved = localStorage.getItem('admin_theme_config');
    if (configSaved) {
      try {
        const cfg = JSON.parse(configSaved) as ThemeConfig;
        if (cfg.dark_mode_default) return 'dark';
      } catch { /* ignore */ }
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [themeConfig, setThemeConfigState] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('admin_theme_config');
    if (saved) {
      try {
        return { ...defaultThemeConfig, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return defaultThemeConfig;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    applyThemeConfigToDOM(themeConfig);
  }, [themeConfig]);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await api.get('/admin/theme');
        if (response.data) {
          const merged = { ...defaultThemeConfig, ...response.data };
          setThemeConfigState(merged);
          localStorage.setItem('admin_theme_config', JSON.stringify(merged));
          applyThemeConfigToDOM(merged);
        }
      } catch {
        const saved = localStorage.getItem('admin_theme_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ThemeConfig;
            setThemeConfigState({ ...defaultThemeConfig, ...parsed });
            applyThemeConfigToDOM({ ...defaultThemeConfig, ...parsed });
          } catch { /* ignore */ }
        }
      }
    };
    fetchTheme();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setThemeConfig = useCallback((config: ThemeConfig) => {
    setThemeConfigState(config);
    localStorage.setItem('admin_theme_config', JSON.stringify(config));
    applyThemeConfigToDOM(config);
    if (config.dark_mode_default) {
      setTheme('dark');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeConfig, setThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
