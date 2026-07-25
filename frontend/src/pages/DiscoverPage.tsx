import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { ArticleModal } from '../components/ArticleModal';
import { Search, Filter, Sparkles, Globe } from 'lucide-react';
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

interface CountryItem {
  name: string;
  code: string;
}

const DEFAULT_CATEGORIES = ['All', 'Technology', 'Sports', 'Entertainment', 'Politics', 'Business', 'Science', 'Health', 'Environment'];
const DEFAULT_COUNTRIES: CountryItem[] = [
  { name: 'India', code: 'in' },
  { name: 'USA', code: 'us' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'Canada', code: 'ca' },
  { name: 'Australia', code: 'au' },
  { name: 'Germany', code: 'de' },
  { name: 'France', code: 'fr' },
  { name: 'Japan', code: 'jp' },
  { name: 'Brazil', code: 'br' },
  { name: 'South Africa', code: 'za' },
  { name: 'Singapore', code: 'sg' },
  { name: 'UAE', code: 'ae' },
];

const DiscoverPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [countries] = useState<CountryItem[]>(DEFAULT_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState('in');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredCard = useRef<string | null>(null);

  const handleHover = useCallback((id: string | null) => {
    if (id) {
      hoveredCard.current = id;
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => setSelectedArticleId(id), 200);
    } else {
      hoveredCard.current = null;
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => {
        if (!hoveredCard.current) setSelectedArticleId(null);
      }, 400);
    }
  }, []);

  const handleModalEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  }, []);

  const handleModalLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (!hoveredCard.current) setSelectedArticleId(null);
    }, 400);
  }, []);

  useEffect(() => {
    return () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); };
  }, []);

  useEffect(() => {
    api.get('/news/categories').then(res => {
      if (res.data?.categories) setCategories(['All', ...res.data.categories]);
    }).catch(() => {});
  }, []);

  const fetchArticles = useCallback(async (p: number, cat: string, query: string, country: string) => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page: p, page_size: 12 };
      if (cat && cat !== 'All') params.category = cat;
      if (query) params.query = query;
      params.country = country;
      const response = await api.get('/news', { params });
      setArticles(response.data.items || []);
      setTotalPages(response.data.total_pages || 1);
    } catch {
      setError('Failed to load articles.');
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(page, category, searchQuery, selectedCountry);
  }, [page, category, selectedCountry, fetchArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles(1, category, searchQuery, selectedCountry);
  };

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setPage(1);
  };

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting bg-primary text-white">
        <h1>Discover</h1>
        <p>Explore the latest news across every country, powered by GNews.</p>
      </div>

      <div className="discover-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)',
              fontSize: '0.9375rem'
            }}
          />
        </form>
      </div>

      <div className="discover-countries" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <Globe size={16} style={{ color: 'var(--color-text-muted)', alignSelf: 'center' }} />
        {countries.map((c) => (
          <button
            key={c.code}
            onClick={() => handleCountryChange(c.code)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
              background: selectedCountry === c.code ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
              color: selectedCountry === c.code ? 'white' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
              transition: 'all var(--transition-fast)',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="discover-categories" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <Filter size={16} style={{ color: 'var(--color-text-muted)', alignSelf: 'center' }} />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
              background: category === cat ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
              color: category === cat ? 'white' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
              transition: 'all var(--transition-fast)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <div className="loading-state">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <Sparkles size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
          <p className="text-muted" style={{ fontSize: '1.125rem' }}>No articles found. Try a different category or country.</p>
        </div>
      ) : (
        <>
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
                onHover={handleHover}
                onClick={() => window.open(`/article/${article.id}`, '_blank')}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)', cursor: page <= 1 ? 'default' : 'pointer', fontWeight: 500 }}>
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--color-text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)', cursor: page >= totalPages ? 'default' : 'pointer', fontWeight: 500 }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
      {selectedArticleId && (
        <div onMouseEnter={handleModalEnter} onMouseLeave={handleModalLeave}>
          <ArticleModal articleId={selectedArticleId} onClose={() => { setSelectedArticleId(null); if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }} />
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
