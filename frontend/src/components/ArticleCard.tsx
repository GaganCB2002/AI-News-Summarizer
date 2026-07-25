import type React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import './ArticleCard.css';

interface ArticleCardProps {
  id: string;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  readTime: number;
  readersCount?: number;
  isNew?: boolean;
  onClick?: () => void;
  onHover?: (id: string | null) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  id,
  title,
  summary,
  category,
  imageUrl,
  readTime,
  readersCount,
  isNew,
  onClick,
  onHover
}) => {
  return (
    <div
      className="article-card glass-panel"
      onClick={onClick}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      style={{ cursor: onClick ? 'pointer' : undefined }}>
      <div className="article-card-image">
        <img src={imageUrl} alt={title} loading="lazy" />
      </div>
      
      <div className="article-card-content">
        <div className="article-card-meta">
          <Badge variant={isNew ? 'purple' : 'blue'} size="sm">
            {category}
          </Badge>
          <span className="article-card-time">
            <Clock size={14} /> {readTime} min read
          </span>
        </div>
        
        <h3 className="article-card-title">{title}</h3>
        <p className="article-card-summary">{summary}</p>
        
        <div className="article-card-footer">
          <div className="article-card-readers">
            {isNew ? (
              <span className="text-muted text-sm">New this morning</span>
            ) : readersCount ? (
              <>
                <div className="reader-avatars">
                  <div className="reader-avatar" style={{ backgroundColor: '#c084fc' }}></div>
                  <div className="reader-avatar" style={{ backgroundColor: '#60a5fa' }}></div>
                </div>
                <span className="text-muted text-sm">Summarized by {readersCount}K readers</span>
              </>
            ) : null}
          </div>
          
          {onClick ? (
            <Button variant="outline" size="sm" icon={<Sparkles size={14} />} onClick={(e) => { e.stopPropagation(); onClick(); }}>
              View Summary
            </Button>
          ) : (
            <Link to={`/article/${id}`}>
              <Button variant="outline" size="sm" icon={<Sparkles size={14} />}>
                View Summary
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
