import type React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { FileText, Clock, Trash2, Sparkles } from 'lucide-react';
import api from '../services/api';
import './DashboardPage.css';

interface SummaryItem {
  id: string;
  article_id: string;
  summarized_text: string;
  model_used: string;
  compression_ratio: number;
  created_at: string;
  article?: {
    title: string;
    category: string;
  };
}

const SummariesPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummaries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/summaries', { params: { page: 1, page_size: 50 } });
      setSummaries(response.data.items || []);
    } catch {
      setError('Failed to load summaries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSummaries();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/summaries/${id}`);
      setSummaries(prev => prev.filter(s => s.id !== id));
    } catch {
      setError('Failed to delete summary.');
    }
  };

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting bg-primary text-white">
        <h1>Summaries</h1>
        <p>All your AI-generated summaries in one place.</p>
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <div className="loading-state">Loading summaries...</div>
      ) : summaries.length === 0 ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>No summaries yet. Browse articles and generate summaries.</p>
          <Link to="/discover" style={{ marginTop: '1rem', display: 'inline-block' }}>
            <button className="btn btn-primary btn-md">Discover Articles</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {summaries.map((summary) => (
            <div key={summary.id} className="stat-card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Sparkles size={18} className="text-primary" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', lineHeight: 1.3 }}>{summary.article?.title || 'Article Summary'}</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {new Date(summary.created_at).toLocaleDateString()}
                    </span>
                    {summary.article?.category && (
                      <span className="badge badge-blue badge-sm">{summary.article.category}</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', flex: 1, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {summary.summarized_text}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                <span className="text-xs text-muted">Compression: {summary.compression_ratio ? Math.round((1 - summary.compression_ratio) * 100) : 'N/A'}%</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/article/${summary.article_id}`}>
                    <button className="btn btn-outline btn-sm">View</button>
                  </Link>
                  <button onClick={() => handleDelete(summary.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SummariesPage;
