import type React from 'react';
import { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, Clock, Share2, Globe, User, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import api from '../services/api';
import './ArticleModal.css';

interface ArticleModalProps {
  articleId: string;
  onClose: () => void;
}

interface ArticleDetail {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  summary: string | null;
  category: string | null;
  image_url: string | null;
  source: string;
  source_url: string | null;
  url: string;
  author: string | null;
  published_at: string | null;
  is_summarized: boolean;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ articleId, onClose }) => {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/news/${articleId}`)
      .then(res => { setArticle(res.data); setSummary(res.data.summary); })
      .catch(() => setError('Failed to load article details'))
      .finally(() => setLoading(false));
  }, [articleId]);

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const res = await api.post(`/news/${articleId}/summarize`);
      setSummary(res.data.summarized_text || res.data.summary);
    } catch {
      setError('Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  const handleShare = () => {
    if (article?.url) {
      navigator.clipboard.writeText(article.url);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-loading">
            <Loader size={32} className="spin" />
            <p>Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Error</h2>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
          </div>
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>{error || 'Article not found'}</p>
        </div>
      </div>
    );
  }

  const displayContent = article.content || article.description || 'No content available';
  const contentExceeds = displayContent.length > 500;
  const showContent = showFullContent || !contentExceeds;
  const displayText = showContent ? displayContent : displayContent.slice(0, 500) + '...';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <Badge variant="purple" size="sm">{article.category || 'General'}</Badge>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-scroll">
          {article.image_url && (
            <div className="modal-image">
              <img src={article.image_url} alt={article.title} />
            </div>
          )}

          <h1 className="modal-title">{article.title}</h1>

          <div className="modal-meta">
            {article.author && (
              <span><User size={14} /> {article.author}</span>
            )}
            <span><Globe size={14} /> {article.source}</span>
            {article.published_at && (
              <span><Clock size={14} /> {new Date(article.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>

          <div className="modal-full-article">
            <h3 className="modal-section-title">Full Article</h3>
            <div className="modal-content-text">
              <p>{displayText}</p>
            </div>
            {contentExceeds && (
              <button className="modal-toggle-btn" onClick={() => setShowFullContent(!showFullContent)}>
                {showFullContent ? <>Show less <ChevronUp size={16} /></> : <>Read full article <ChevronDown size={16} /></>}
              </button>
            )}
          </div>

          <div className="modal-divider" />

          <div className="modal-actions">
            {summary ? (
              <div className="modal-summary-section">
                <h3 className="modal-section-title">
                  <Sparkles size={16} /> AI Summary
                </h3>
                <p className="modal-summary-text">{summary}</p>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={summarizing ? <Loader size={16} className="spin" /> : <Sparkles size={16} />}
                onClick={handleSummarize}
                disabled={summarizing}
              >
                {summarizing ? 'Generating AI Summary...' : 'Generate AI Summary'}
              </Button>
            )}

            <div className="modal-action-buttons">
              <Button variant="outline" size="md" icon={<ExternalLink size={14} />} onClick={() => window.open(article.url, '_blank')}>
                Read Original
              </Button>
              <Button variant="outline" size="md" icon={<Share2 size={14} />} onClick={handleShare}>
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
