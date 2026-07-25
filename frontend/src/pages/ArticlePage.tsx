import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Sparkles, Bookmark, BookmarkCheck, Share2, ExternalLink, Clock, Loader2, ChevronRight, Globe } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api from '../services/api';
import './ArticlePage.css';

interface ArticleDetail {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  category: string | null;
  image_url: string | null;
  source: string;
  source_url: string | null;
  url: string | null;
  author: string | null;
  published_at: string | null;
  is_summarized: boolean;
  country?: string;
  language?: string;
}

interface SummaryResponse {
  summarized_text: string;
  model_used?: string;
  compression_ratio?: number;
}

const SHARE_FEEDBACK_DURATION = 2000;

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const recordedRef = useRef(false);
  const readingStartRef = useRef(0);

  useDocumentTitle(article ? article.title : 'Loading Article...');

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const articleRes = await api.get<ArticleDetail>(`/news/${id}`, { signal: controller.signal });
        setArticle(articleRes.data);
        try {
          const summaryRes = await api.get<SummaryResponse>(`/news/${id}/summary`, { signal: controller.signal });
          setSummary(summaryRes.data);
        } catch {
          // No summary yet
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Failed to load article.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    if (user && article && !error && id && !recordedRef.current) {
      recordedRef.current = true;
      readingStartRef.current = Date.now();
      api.post(`/history/reading/${id}`).catch(() => {});
    }
  }, [user, article, id, error]);

  useEffect(() => {
    return () => {
      if (id && readingStartRef.current > 0) {
        const elapsed = Math.round((Date.now() - readingStartRef.current) / 1000);
        api.put(`/history/reading/${id}`, { reading_time_seconds: elapsed }).catch(() => {});
      }
    };
  }, [id]);

  const handleBookmark = async () => {
    if (!user) return;
    setIsBookmarking(true);
    try {
      await api.post('/bookmarks', { article_id: id });
      setIsBookmarked(true);
    } catch {
      setIsBookmarked(false);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    const url = article?.url || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback('Link copied!');
    } catch {
      setShareFeedback('Failed to copy link');
    }
    setTimeout(() => setShareFeedback(''), SHARE_FEEDBACK_DURATION);
  };

  const generateSummary = async () => {
    if (!id || !user) return;
    setIsSummarizing(true);
    try {
      const res = await api.post(`/news/${id}/summarize`);
      setSummary(res.data);
    } catch {
      setError('Failed to generate AI summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="article-page">
        <div className="article-loading-skeleton">
          <div className="skeleton-block" style={{ height: '480px', marginBottom: '2.5rem', borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton-block" style={{ height: '1rem', width: '30%', marginBottom: '1rem' }} />
          <div className="skeleton-block" style={{ height: '2.75rem', width: '85%', marginBottom: '0.75rem' }} />
          <div className="skeleton-block" style={{ height: '2.75rem', width: '60%', marginBottom: '2rem' }} />
          <div className="skeleton-block" style={{ height: '1rem', width: '40%', marginBottom: '2.5rem' }} />
          <div className="skeleton-block" style={{ height: '1.25rem', marginBottom: '0.75rem' }} />
          <div className="skeleton-block" style={{ height: '1.25rem', marginBottom: '0.75rem' }} />
          <div className="skeleton-block" style={{ height: '1.25rem', width: '70%', marginBottom: '0.75rem' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-page">
        <div className="article-error">
          <p>{error}</p>
          <Link to="/discover" className="back-link">Back to Discover</Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page">
        <div className="article-error">
          <p>Article not found.</p>
          <Link to="/discover" className="back-link">Back to Discover</Link>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'UN';
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const contentParagraphs = article.content
    ? article.content.split('\n').filter((p: string) => p.trim())
    : article.description
      ? [article.description]
      : ['No content available.'];

  return (
    <div className="article-page">
      <div className="article-breadcrumbs">
        <Link to="/discover"><ArrowLeft size={14} /> Discover</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{article.category || 'News'}</span>
      </div>

      <div className="article-category-badge">
        {article.category || 'General'}
      </div>

      <h1 className="article-title">{article.title}</h1>

      <div className="article-meta">
        <div className="article-author-avatar" style={{ backgroundColor: getAvatarColor(article.author || article.source) }}>
          {getInitials(article.author || article.source)}
        </div>
        <div className="article-author-info">
          <span className="article-author-name">{article.author || article.source || 'Unknown Source'}</span>
          <span className="article-date-source">
            {article.published_at ? formatDate(article.published_at) : 'Date unknown'}
          </span>
        </div>
        <div className="article-meta-right">
          {article.source && (
            <span className="article-source-badge">
              <Globe size={12} /> {article.source}
            </span>
          )}
          {article.is_summarized && (
            <span className="article-summarized-badge">
              <Sparkles size={12} /> Summarized
            </span>
          )}
        </div>
      </div>

      {article.image_url ? (
        <div className="article-hero-image">
          <img src={article.image_url} alt={article.title}
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.style.display = 'none';
            }} />
          <div className="hero-image-overlay" />
        </div>
      ) : (
        <div className="article-hero-image article-hero-placeholder">
          <div className="image-placeholder-text">BrieflyAI</div>
        </div>
      )}

      <div className="article-layout">
        <div className="article-body">
          {article.description && (
            <div className="article-description">
              {article.description}
            </div>
          )}

          {user ? (
            summary ? (
              <div className="ai-summary-section">
                <div className="ai-summary-header">
                  <div className="ai-summary-icon">
                    <Sparkles size={18} />
                  </div>
                  <h2>AI Executive Summary</h2>
                  <span className="ai-summary-model">{summary.model_used || 'AI'}</span>
                </div>
                <p className="ai-summary-text">{summary.summarized_text}</p>
                {summary.compression_ratio && (
                  <div className="ai-summary-details">
                    <div className="ai-summary-detail">
                      <Clock size={14} />
                      <span>Compression: {Math.round((1 - summary.compression_ratio) * 100)}% smaller</span>
                    </div>
                    <div className="ai-summary-detail">
                      <Sparkles size={14} />
                      <span>Generated by {summary.model_used || 'AI'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-summary-cta">
                <div className="ai-summary-cta-icon">
                  <Sparkles size={22} />
                </div>
                <h3>AI Summary</h3>
                <p className="cta-text">
                  Click below to generate a concise AI-powered summary of this article.
                </p>
                <button
                  onClick={generateSummary}
                  disabled={isSummarizing}
                  className="cta-button"
                >
                  {isSummarizing ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {isSummarizing ? 'Generating...' : 'Generate AI Summary'}
                </button>
              </div>
            )
          ) : (
            <div className="login-prompt-banner">
              <Sparkles size={32} />
              <h3>AI-Powered Summaries</h3>
              <p>Sign in to generate instant AI summaries powered by Gemini.</p>
              <Link to="/login" className="login-prompt-btn">
                Sign in to Unlock <ChevronRight size={14} />
              </Link>
            </div>
          )}

          <div className="article-content-divider">
            <span>Full Article</span>
          </div>

          <div className="article-full-content">
            {contentParagraphs.map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="article-source-attribution">
            <span>Source: </span>
            <a href={article.url || article.source_url || undefined} target="_blank" rel="noopener noreferrer">
              {article.source || 'Original Source'}
            </a>
            {article.url && (
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-original-link">
                <ExternalLink size={14} /> Read original article
              </a>
            )}
          </div>
        </div>

        <div className="article-sidebar">
          <div className="sidebar-sticky">
            {article.url && (
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn-read-original">
                <ExternalLink size={16} /> Read Original
              </a>
            )}

            {user && !summary && (
              <button className="btn-summarize" onClick={generateSummary} disabled={isSummarizing}>
                {isSummarizing ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                {isSummarizing ? 'Generating...' : 'AI Summarize'}
              </button>
            )}

            <div className="sidebar-card">
              <div className="sidebar-card-title">Quick Actions</div>
              <div className="sidebar-action-grid">
                <button className={`sidebar-action-btn ${isBookmarked ? 'active' : ''}`}
                  onClick={handleBookmark} disabled={isBookmarking || isBookmarked}>
                  {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  {isBookmarked ? 'Saved' : 'Save'}
                </button>
                <button className="sidebar-action-btn" onClick={handleShare}>
                  <Share2 size={18} /> {shareFeedback || 'Share'}
                </button>
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-title">Source Info</div>
              <div className="sidebar-source-info">
                <span className="sidebar-source-name">{article.source || 'Unknown'}</span>
                <span className="sidebar-source-meta">
                  {article.country ? `${article.country.toUpperCase()} ` : ''}
                  {article.language ? `· ${article.language.toUpperCase()}` : ''}
                </span>
              </div>
            </div>

            {article.published_at && (
              <div className="sidebar-card">
                <div className="sidebar-card-title">Published</div>
                <div className="sidebar-published">
                  <Clock size={14} />
                  {formatDate(article.published_at)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
