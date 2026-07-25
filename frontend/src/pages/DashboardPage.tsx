import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Clock, BarChart, FileText, TrendingUp, Sparkles, ArrowRight, Compass, Layers, RefreshCw } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
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
}

interface AnalyticsData {
  total_articles: number;
  total_summaries: number;
  reading_time_saved: number;
  category_distribution: { name: string; count: number }[];
}

const StatCardSkeleton: React.FC = () => (
  <div className="stat-card glass-panel" style={{ pointerEvents: 'none' }}>
    <div className="stat-card-header">
      <div className="skeleton-block" style={{ width: '120px', height: '16px', borderRadius: '4px' }} />
      <div className="skeleton-block" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
    </div>
    <div className="stat-card-value">
      <div className="skeleton-block" style={{ width: '80px', height: '40px', borderRadius: '6px' }} />
    </div>
  </div>
);

const ArticleCardSkeleton: React.FC = () => (
  <div className="article-card glass-panel" style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', pointerEvents: 'none' }}>
    <div className="skeleton-block" style={{ width: '160px', minHeight: '120px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="skeleton-block" style={{ width: '70%', height: '20px', borderRadius: '4px' }} />
      <div className="skeleton-block" style={{ width: '100%', height: '14px', borderRadius: '4px' }} />
      <div className="skeleton-block" style={{ width: '90%', height: '14px', borderRadius: '4px' }} />
      <div className="skeleton-block" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <div className="skeleton-block" style={{ width: '80px', height: '24px', borderRadius: '999px' }} />
        <div className="skeleton-block" style={{ width: '60px', height: '24px', borderRadius: '999px' }} />
      </div>
    </div>
  </div>
);

const SidebarSkeleton: React.FC = () => (
  <>
    <div className="side-widget glass-panel" style={{ pointerEvents: 'none' }}>
      <div className="skeleton-block" style={{ width: '140px', height: '18px', borderRadius: '4px', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-block" style={{ width: `${70 + i * 5}%`, height: '32px', borderRadius: '999px' }} />
        ))}
      </div>
    </div>
    <div className="side-widget glass-panel" style={{ pointerEvents: 'none' }}>
      <div className="skeleton-block" style={{ width: '100px', height: '18px', borderRadius: '4px', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="skeleton-block" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-block" style={{ width: '100px', height: '14px', borderRadius: '4px', marginBottom: '4px' }} />
              <div className="skeleton-block" style={{ width: '80px', height: '12px', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

const DashboardPage: React.FC = () => {
  useDocumentTitle('Dashboard');
  const { user, isLoading: authLoading } = useAuth();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    try {
      const [articleRes, analyticsRes] = await Promise.all([
        api.get('/news', { params: { page: 1, page_size: 10, sort_by: 'published_at', sort_order: 'desc' } }),
        api.get('/analytics/stats'),
      ]);
      setArticles(articleRes.data.items || []);
      setAnalytics(analyticsRes.data ?? null);
    } catch {
      setArticles([]);
      setAnalytics(null);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading) {
    return <div className="loading-state">Loading your feed...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const uniqueCategories = new Set(articles.map(a => a.category).filter(Boolean));
  const summarizedCount = articles.filter(a => a.is_summarized).length;

  const readingTimeSaved = analytics ? Math.round(analytics.reading_time_saved) : 0;
  const totalHours = analytics && analytics.total_summaries > 0
    ? Math.round(analytics.total_summaries * 3.5 / 60)
    : 0;
  const categoryDist = analytics?.category_distribution?.slice(0, 6) ?? [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting bg-primary text-white">
        <h1>{greeting}, {user?.username || 'Alex'}.</h1>
        <p>AI has analyzed the latest news to bring you the most relevant insights.</p>
      </div>

      {error && (
        <div className="error-state" style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.5rem', background: 'var(--color-error-bg, #fef2f2)',
          border: '1px solid var(--color-error, #ef4444)', borderRadius: 'var(--radius-md)',
          color: 'var(--color-error, #dc2626)'
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <Button variant="primary" onClick={fetchData} size="sm">
            <RefreshCw size={14} style={{ marginRight: '0.35rem' }} /> Retry
          </Button>
        </div>
      )}

      <div className="dashboard-stats">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <span className="stat-title text-muted text-sm font-semibold">ARTICLES AVAILABLE</span>
                <FileText size={16} className="text-primary" />
              </div>
              <div className="stat-card-value">
                <span className="value">{analytics?.total_articles ?? articles.length}</span>
                <span className="text-muted text-sm ml-2">Total articles</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <span className="stat-title text-muted text-sm font-semibold">SUMMARIES GENERATED</span>
                <BarChart size={16} className="text-secondary" />
              </div>
              <div className="stat-card-value">
                <span className="value">{analytics?.total_summaries ?? 0}</span>
                <span className="trend text-success text-sm">
                  {summarizedCount > 0 ? `${summarizedCount} on this page` : ''}
                </span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <span className="stat-title text-muted text-sm font-semibold">READING TIME SAVED</span>
                <Clock size={16} className="text-success" />
              </div>
              <div className="stat-card-value">
                <span className="value">
                  {analytics ? `${readingTimeSaved}m` : '—'}
                </span>
                <span className="trend text-success text-sm">
                  {totalHours > 0 ? `~${totalHours}h total` : ''}
                </span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-header">
                <span className="stat-title text-muted text-sm font-semibold">CATEGORIES</span>
                <Layers size={16} className="text-primary" />
              </div>
              <div className="stat-card-value">
                <span className="value">{uniqueCategories.size}</span>
                <span className="text-muted text-sm ml-2">Active categories</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-content">
        <div className="main-feed">
          <div className="feed-header">
            <h2>Curated For You</h2>
            <div className="feed-tabs">
              <Link to="/discover" className="tab active">Latest</Link>
              <Link to="/archive" className="tab">All Articles</Link>
            </div>
          </div>

          <div className="feed-list">
            {isLoading ? (
              <>
                <ArticleCardSkeleton />
                <ArticleCardSkeleton />
                <ArticleCardSkeleton />
              </>
            ) : articles.length === 0 ? (
              <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
                <Sparkles size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  No articles yet.
                </p>
                <Link to="/discover">
                  <Button variant="primary">Discover News</Button>
                </Link>
              </div>
            ) : (
              articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  summary={article.summary || article.description || 'Read more about this story...'}
                  category={article.category || 'General'}
                  imageUrl={article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?auto=format&fit=crop&w=800&q=80'}
                  readTime={3}
                />
              ))
            )}
          </div>
        </div>

        <div className="side-feed">
          {isLoading ? (
            <SidebarSkeleton />
          ) : (
            <>
              <div className="side-widget glass-panel">
                <h3>Trending Categories</h3>
                <div className="tags-list">
                  {categoryDist.length > 0 ? (
                    categoryDist.map((cat) => (
                      <Badge key={cat.name} variant="gray">
                        #{cat.name} <span className="tag-count">{cat.count}</span>
                      </Badge>
                    ))
                  ) : (
                    <>
                      <Badge variant="gray">#Technology <span className="tag-count">—</span></Badge>
                      <Badge variant="gray">#Science <span className="tag-count">—</span></Badge>
                      <Badge variant="gray">#Business <span className="tag-count">—</span></Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="side-widget glass-panel">
                <div className="widget-header">
                  <h3>Quick Stats</h3>
                </div>
                <div className="history-list">
                  <div className="history-item">
                    <div className="history-icon" style={{ background: 'var(--color-accent-light-blue)' }}>
                      <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className="history-content">
                      <h4>Articles Loaded</h4>
                      <p className="text-xs text-muted">{articles.length} on this page</p>
                    </div>
                  </div>
                  <div className="history-item">
                    <div className="history-icon" style={{ background: 'var(--color-accent-light-purple)' }}>
                      <Layers size={16} style={{ color: 'var(--color-secondary)' }} />
                    </div>
                    <div className="history-content">
                      <h4>Categories Represented</h4>
                      <p className="text-xs text-muted">{uniqueCategories.size} unique</p>
                    </div>
                  </div>
                  <div className="history-item">
                    <div className="history-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                      <Sparkles size={16} style={{ color: '#10b981' }} />
                    </div>
                    <div className="history-content">
                      <h4>AI Summaries</h4>
                      <p className="text-xs text-muted">{summarizedCount} available</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pro-tip-card">
            <Badge variant="blue" size="sm" className="mb-2 uppercase tracking-wide text-[10px]">Pro Tip</Badge>
            <h3>Explore Discover</h3>
            <p className="text-sm opacity-90 mt-2 mb-4">
              Browse 8+ categories of AI-summarized news. Find articles tailored to your interests.
            </p>
            <Link to="/discover">
              <Button variant="secondary" fullWidth className="bg-white text-gray-900 hover:bg-gray-100 border-none font-semibold">
                <Compass size={16} /> Go to Discover <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
