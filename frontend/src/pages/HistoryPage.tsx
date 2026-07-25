import type React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { History, Clock, Search, FileText } from 'lucide-react';
import api from '../services/api';
import './DashboardPage.css';

const HistoryPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'reading' | 'search' | 'summary'>('reading');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async (tab: string) => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = tab === 'reading' ? '/history/reading' : tab === 'search' ? '/history/search' : '/history/summary';
      const response = await api.get(endpoint, { params: { page: 1, page_size: 50 } });
      setItems(response.data.items || []);
    } catch {
      setError('Failed to load history.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchHistory(activeTab);
  }, [user, activeTab]);

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const tabs = [
    { key: 'reading', label: 'Reading History', icon: <Clock size={16} /> },
    { key: 'search', label: 'Search History', icon: <Search size={16} /> },
    { key: 'summary', label: 'Summary History', icon: <FileText size={16} /> },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting bg-primary text-white">
        <h1>History</h1>
        <p>Your reading, search, and summary activity.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
              background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--color-text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <div className="loading-state">Loading history...</div>
      ) : items.length === 0 ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <History size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>No {activeTab} history yet.</p>
          {activeTab === 'reading' && <Link to="/discover" style={{ marginTop: '1rem', display: 'inline-block' }}><button className="btn btn-primary btn-md">Discover Articles</button></Link>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {items.map((item: any) => (
            <div key={item.id} className="stat-card glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {activeTab === 'reading' && (
                  <Link to={`/article/${item.article_id}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                    View Article
                  </Link>
                )}
                {activeTab === 'search' && <span style={{ fontWeight: 500 }}>"{item.query}" <span className="text-xs text-muted">({item.results_count} results)</span></span>}
                {activeTab === 'summary' && <span style={{ fontWeight: 500 }}>Summary {item.article_id ? <Link to={`/article/${item.article_id}`} style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>View</Link> : ''}</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Clock size={12} className="text-muted" />
                  <span className="text-xs text-muted">{new Date(item.read_at || item.searched_at || item.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
