import type React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Bookmark, Trash2, Clock, ExternalLink } from 'lucide-react';
import api from '../services/api';
import './DashboardPage.css';

interface BookmarkItem {
  id: string;
  article_id: string;
  created_at: string;
}

const BookmarksPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookmarks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/bookmarks', { params: { page: 1, page_size: 50 } });
      setBookmarks(response.data.items || []);
    } catch {
      setError('Failed to load bookmarks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  const handleRemove = async (id: string) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch {
      setError('Failed to remove bookmark.');
    }
  };

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting bg-primary text-white">
        <h1>Bookmarks</h1>
        <p>Your saved articles for later reading.</p>
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <div className="loading-state">Loading bookmarks...</div>
      ) : bookmarks.length === 0 ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <Bookmark size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>No bookmarks yet. Save articles while browsing.</p>
          <Link to="/discover" style={{ marginTop: '1rem', display: 'inline-block' }}>
            <button className="btn btn-primary btn-md">Discover Articles</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="stat-card glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bookmark size={18} className="text-primary" />
                <div>
                  <Link to={`/article/${bookmark.article_id}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                    View Article
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Clock size={12} className="text-muted" />
                    <span className="text-xs text-muted">{new Date(bookmark.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to={`/article/${bookmark.article_id}`}>
                  <button className="btn btn-outline btn-sm"><ExternalLink size={14} /></button>
                </Link>
                <button onClick={() => handleRemove(bookmark.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
