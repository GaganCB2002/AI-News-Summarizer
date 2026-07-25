import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../services/api';
import {
  FileText, Bookmark, Trash2, Eye, Search, ChevronLeft, ChevronRight,
  AlertCircle, File, BookOpen,
} from 'lucide-react';
import './AdminContent.css';

type ContentTab = 'articles' | 'summaries' | 'bookmarks';

interface ArticleItem {
  id: string;
  title: string;
  category: string | null;
  source: string;
  published_at: string | null;
  image_url: string | null;
  is_summarized: boolean;
}

interface SummaryItem {
  id: string;
  article_title: string;
  article_id: string;
  content: string;
  created_at: string;
  word_count: number;
}

interface BookmarkItem {
  id: string;
  article_id: string;
  article_title: string;
  article_category: string | null;
  user_id: string;
  username: string;
  created_at: string;
}

const PAGE_SIZE = 10;

const AdminContent: React.FC = () => {
  useDocumentTitle('Content Management');
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ContentTab>('articles');
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;

      let res;
      switch (activeTab) {
        case 'articles':
          res = await api.get('/admin/content/articles', { params });
          setArticles(res.data.items ?? res.data ?? []);
          break;
        case 'summaries':
          res = await api.get('/admin/content/summaries', { params });
          setSummaries(res.data.items ?? res.data ?? []);
          break;
        case 'bookmarks':
          res = await api.get('/admin/content/bookmarks', { params });
          setBookmarks(res.data.items ?? res.data ?? []);
          break;
      }
      setTotal(res?.data?.total ?? 0);
    } catch {
      setError(`Failed to load ${activeTab}.`);
      setArticles([]);
      setSummaries([]);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, search]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (type: string, id: string) => {
    try {
      await api.delete(`/admin/content/${type}/${id}`);
      fetchData();
    } catch {
      setError(`Failed to delete ${type}.`);
    }
  };

  const tabs: { key: ContentTab; label: string; icon: React.ReactNode }[] = [
    { key: 'articles', label: 'Articles', icon: <FileText size={15} /> },
    { key: 'summaries', label: 'Summaries', icon: <BookOpen size={15} /> },
    { key: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={15} /> },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user?.is_superuser) return <Navigate to="/login" />;

  return (
    <div className="admin-content-page">
      <h1>Content Management</h1>

      <div className="content-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`content-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="admin-error-state">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="content-toolbar">
        <div className="content-search">
          <Search size={16} className="content-search-icon" />
          <input
            type="text"
            className="content-search-input"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="content-list-wrapper glass-panel">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="content-list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', flex: 1 }}>
                <div className="admin-skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ flex: 1 }}>
                  <div className="admin-skeleton" style={{ width: '60%', height: '16px', marginBottom: '6px' }} />
                  <div className="admin-skeleton" style={{ width: '40%', height: '12px' }} />
                </div>
              </div>
            </div>
          ))
        ) : activeTab === 'articles' ? (
          articles.length === 0 ? (
            <div className="content-list-empty">
              <FileText size={32} />
              <p>No articles found.</p>
            </div>
          ) : (
            articles.map(article => (
              <div key={article.id} className="content-list-item">
                <div className="content-item-card" style={{ flex: 1 }}>
                  {article.image_url ? (
                    <img src={article.image_url} alt="" className="content-item-image" />
                  ) : (
                    <div className="content-item-image-placeholder"><File size={24} /></div>
                  )}
                  <div className="content-item-info">
                    <div className="content-item-title">{article.title}</div>
                    <div className="content-item-meta">
                      <span>{article.category || 'Uncategorized'}</span>
                      <span>•</span>
                      <span>{article.source}</span>
                      {article.published_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(article.published_at).toLocaleDateString()}</span>
                        </>
                      )}
                      {article.is_summarized && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--color-success)' }}>Summarized</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="content-item-actions" style={{ padding: '0 1.25rem' }}>
                  <button className="content-action-btn info" title="View" onClick={() => window.open(`/article/${article.id}`, '_blank')}>
                    <Eye size={14} />
                  </button>
                  <button className="content-action-btn danger" title="Delete" onClick={() => handleDelete('articles', article.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'summaries' ? (
          summaries.length === 0 ? (
            <div className="content-list-empty">
              <BookOpen size={32} />
              <p>No summaries found.</p>
            </div>
          ) : (
            summaries.map(summary => (
              <div key={summary.id} className="content-list-item">
                <div className="content-item-card" style={{ flex: 1 }}>
                  <div className="content-item-image-placeholder"><BookOpen size={24} /></div>
                  <div className="content-item-info">
                    <div className="content-item-title">{summary.article_title}</div>
                    <div className="content-item-meta">
                      <span>{summary.word_count} words</span>
                      <span>•</span>
                      <span>Created {new Date(summary.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="content-item-actions" style={{ padding: '0 1.25rem' }}>
                  <button className="content-action-btn info" title="View" onClick={() => window.open(`/article/${summary.article_id}`, '_blank')}>
                    <Eye size={14} />
                  </button>
                  <button className="content-action-btn danger" title="Delete" onClick={() => handleDelete('summaries', summary.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          bookmarks.length === 0 ? (
            <div className="content-list-empty">
              <Bookmark size={32} />
              <p>No bookmarks found.</p>
            </div>
          ) : (
            bookmarks.map(bm => (
              <div key={bm.id} className="content-list-item">
                <div className="content-item-card" style={{ flex: 1 }}>
                  <div className="content-item-image-placeholder"><Bookmark size={24} /></div>
                  <div className="content-item-info">
                    <div className="content-item-title">{bm.article_title}</div>
                    <div className="content-item-meta">
                      <span>by {bm.username}</span>
                      <span>•</span>
                      <span>{bm.article_category || 'Uncategorized'}</span>
                      <span>•</span>
                      <span>{new Date(bm.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="content-item-actions" style={{ padding: '0 1.25rem' }}>
                  <button className="content-action-btn danger" title="Delete" onClick={() => handleDelete('bookmarks', bm.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {totalPages > 1 && (
        <div className="content-pagination">
          <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <ChevronLeft size={14} /> Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const p = i + 1;
            return (
              <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            );
          })}
          <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
