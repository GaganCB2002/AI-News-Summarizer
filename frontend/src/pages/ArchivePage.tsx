import type React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { Archive, Filter } from 'lucide-react';
import api from '../services/api';
import './DashboardPage.css';

interface ArticleItem {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  image_url: string | null;
  source: string;
  is_summarized: boolean;
  published_at: string | null;
  created_at: string;
}

const ArchivePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (!user) return;
    const fetchArchive = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get('/news', {
          params: { page: 1, page_size: 30, sort_by: 'published_at', sort_order: sortOrder }
        });
        setArticles(response.data.items || []);
      } catch {
        setError('Failed to load archive.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArchive();
  }, [user, sortOrder]);

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting bg-primary text-white">
        <h1>Archive</h1>
        <p>Browse all your past articles and summaries.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-sm text-muted">{articles.length} articles</span>
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)',
            fontSize: '0.875rem'
          }}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <div className="loading-state">Loading archive...</div>
      ) : articles.length === 0 ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <Archive size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>No articles in archive yet.</p>
        </div>
      ) : (
        <div className="feed-list">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              summary={article.summary || article.description || 'No summary available'}
              category={article.category || 'General'}
              imageUrl={article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?auto=format&fit=crop&w=800&q=80'}
              readTime={3}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
