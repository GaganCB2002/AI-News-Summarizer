import type React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Zap, Shield, ChevronRight, Clock, Newspaper, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api from '../services/api';
import './HomePage.css';

interface ArticleItem {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  image_url: string | null;
  source: string;
  published_at: string | null;
}

const CATEGORY_TABS = ['All', 'Technology', 'Sports', 'Entertainment', 'Politics', 'Business', 'Science', 'Health'];

const readerAvatars = [
  { bg: '#6366f1', initials: 'SC' },
  { bg: '#10b981', initials: 'JM' },
  { bg: '#f59e0b', initials: 'AK' },
  { bg: '#ef4444', initials: 'PL' },
];

const HomePage: React.FC = () => {
  useDocumentTitle('Home');
  const { user } = useAuth();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = { page: 1, page_size: 6, sort_by: 'published_at', sort_order: 'desc' };
        if (selectedCategory !== 'All') params.category = selectedCategory;
        const res = await api.get('/news', { params });
        setArticles(res.data.items || []);
      } catch {
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, [selectedCategory]);

  return (
    <div className="home-page">
      {/* ─── Hero ─── */}
      <section className="hero-section">
        <div className="hero-grid-bg" />
        <div className="hero-orbs">
          <div className="hero-orb" />
          <div className="hero-orb" />
          <div className="hero-orb" />
        </div>

        <div className="hero-content">
          <div className="hero-text-col">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Now powered by Gemini AI
            </div>

            <h1 className="hero-title">
              The world's news,<br />
              <span className="hero-title-gradient">intelligently distilled</span>
            </h1>

            <p className="hero-subtitle">
              Stay ahead with AI-driven intelligence. BrieflyAI transforms massive news streams 
              into clear, actionable summaries in seconds — so you never miss what matters.
            </p>

            <div className="hero-cta">
              <Link to="/register" className="btn-hero-primary">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                Sign In
              </Link>
            </div>

            <div className="hero-social-proof">
              <div className="reader-avatars">
                {readerAvatars.map((a, i) => (
                  <div key={i} className="reader-avatar-placeholder" style={{ background: a.bg, zIndex: 4 - i }}>
                    {a.initials}
                  </div>
                ))}
              </div>
              <span className="social-proof-text">
                <strong>12,000+</strong> professionals already on board
              </span>
            </div>
          </div>

          <div className="hero-visual-col">
            <div className="hero-visual-frame">
              <div className="hero-dashboard-mockup">
                <div className="mockup-bar">
                  <div className="mockup-bar-left">
                    <div className="mockup-logo-dot" />
                    <span className="mockup-logo-text">BrieflyAI</span>
                  </div>
                  <div className="mockup-bar-right">
                    <div className="mockup-bar-dot" />
                    <div className="mockup-bar-dot" />
                    <div className="mockup-bar-dot" />
                  </div>
                </div>

                <div className="mockup-articles">
                  <div className="mockup-article-row">
                    <div className="mockup-article-img" style={{ background: 'var(--color-accent-light-blue)' }}>
                      <span style={{ fontSize: '1rem' }}>🤖</span>
                    </div>
                    <div className="mockup-article-body">
                      <div className="mockup-article-title" />
                      <div className="mockup-article-title" />
                      <div className="mockup-article-meta" />
                    </div>
                    <span className="mockup-article-tag tech">Tech</span>
                  </div>

                  <div className="mockup-article-row">
                    <div className="mockup-article-img" style={{ background: 'var(--color-accent-light-purple)' }}>
                      <span style={{ fontSize: '1rem' }}>⚽</span>
                    </div>
                    <div className="mockup-article-body">
                      <div className="mockup-article-title" />
                      <div className="mockup-article-title" />
                      <div className="mockup-article-meta" />
                    </div>
                    <span className="mockup-article-tag sports">Sports</span>
                  </div>

                  <div className="mockup-article-row">
                    <div className="mockup-article-img" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                      <span style={{ fontSize: '1rem' }}>📈</span>
                    </div>
                    <div className="mockup-article-body">
                      <div className="mockup-article-title" />
                      <div className="mockup-article-title" />
                      <div className="mockup-article-meta" />
                    </div>
                    <span className="mockup-article-tag business">Business</span>
                  </div>
                </div>
              </div>

              <div className="hero-floating-badge" style={{ top: '-3%', right: '-6%' }}>
                <div className="floating-badge-icon" style={{ background: 'var(--color-accent-light-blue)' }}>
                  <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                </div>
                AI-Powered
              </div>

              <div className="hero-floating-badge" style={{ bottom: '5%', left: '-8%' }}>
                <div className="floating-badge-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <TrendingUp size={14} style={{ color: '#10b981' }} />
                </div>
                8 Categories
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-stat">
            <span className="trust-stat-value">12M+</span>
            <span className="trust-stat-label">Articles Summarized</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-stat">
            <span className="trust-stat-value">500K+</span>
            <span className="trust-stat-label">Global Users</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-stat">
            <span className="trust-stat-value">42</span>
            <span className="trust-stat-label">News Categories</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-stat">
            <span className="trust-stat-value">8</span>
            <span className="trust-stat-label">Languages Supported</span>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Why BrieflyAI</span>
            <h2 className="section-title">Intelligence at your fingertips.</h2>
            <p className="section-sub center">
              Engineered for speed, designed for clarity. Experience the next evolution of information consumption.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card large">
              <div className="feature-icon-wrap" style={{ background: 'var(--color-accent-light-blue)' }}>
                <Sparkles size={22} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3>Advanced AI Summaries</h3>
              <p>
                Read 2,000 words in 20 seconds. Our neural models extract key sentiments, facts, and timelines 
                so you never miss a beat. Powered by Google Gemini for state-of-the-art accuracy.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap" style={{ background: 'var(--color-accent-light-purple)' }}>
                <Zap size={22} style={{ color: 'var(--color-secondary)' }} />
              </div>
              <h3>Lightning Fast</h3>
              <p>Get summaries in real-time as news breaks. Our pipeline processes articles in under 2 seconds.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <TrendingUp size={22} style={{ color: '#10b981' }} />
              </div>
              <h3>Trending Topics</h3>
              <p>Stay ahead with real-time topic detection and trend analysis across all major categories.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Shield size={22} style={{ color: '#f59e0b' }} />
              </div>
              <h3>Trusted Sources</h3>
              <p>Curated from verified publishers with high-factuality scores for reliable intelligence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Today's News ─── */}
      <section className="trending-section">
        <div className="section-container">
          <div className="news-header-row">
            <div>
              <span className="section-label">Live Feed</span>
              <h2 className="section-title" style={{ marginBottom: 0 }}>BrieflyAI</h2>
              <p className="section-sub" style={{ marginTop: '0.5rem' }}>Real-time updates across every category.</p>
            </div>
            <Link to="/discover" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500,
              textDecoration: 'none', transition: 'all var(--transition-fast)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              View all articles <ArrowRight size={15} />
            </Link>
          </div>

          <div className="category-tabs">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner-ring" />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Loading latest news...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="loading-spinner">
              <Newspaper size={48} style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                No news available for this category.{' '}
                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link> to explore.
              </p>
            </div>
          ) : (
            <>
              <div className="news-grid">
                {articles.map((article) => (
                  <Link key={article.id} to={user ? `/article/${article.id}` : "/login"} className="news-card" style={{ textDecoration: 'none' }}>
                    <div className="news-card-img">
                      {article.image_url ? (
                        <img src={article.image_url} alt={article.title}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : null}
                      <div className="news-card-img-overlay">
                        <span className="news-card-category">{article.category}</span>
                      </div>
                    </div>
                    <div className="news-card-body">
                      <div className="news-card-date">
                        <Clock size={12} />
                        {article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : ''}
                      </div>
                      <h4 className="news-card-title">{article.title}</h4>
                      <p className="news-card-desc">{article.description || article.summary}</p>
                      <div className="news-card-footer">
                        <span className="news-card-source">{article.source}</span>
                        <span className="news-card-read">
                          Read <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="news-cta-row">
                <Link to="/login" className="btn-hero-secondary" style={{ display: 'inline-flex' }}>
                  Sign in to Read Full Articles <ChevronRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Testimonials</span>
            <h2 className="section-title">Trusted by industry leaders.</h2>
            <p className="section-sub center">
              See how BrieflyAI is transforming the way professionals consume news.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card featured">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "BrieflyAI has completely changed how I prepare for my morning meetings. 
                I get the pulse of the market in under five minutes. The AI summaries are 
                remarkably accurate and save me hours every week."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: '#6366f1' }}>SC</div>
                <div>
                  <div className="testimonial-name">Sarah Chen</div>
                  <div className="testimonial-role">Partner at Nexus Ventures</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "The category coverage is outstanding. I can follow tech, politics, and 
                business all in one place without the noise."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: '#10b981' }}>JM</div>
                <div>
                  <div className="testimonial-name">James Mitchell</div>
                  <div className="testimonial-role">CTO at DataFlow Inc.</div>
                </div>
              </div>
            </div>

            <div className="newsletter-card">
              <h3>Never miss a pulse.</h3>
              <p>Join our weekly digest and get curated AI insights directly in your inbox.</p>
              <div className="newsletter-form">
                <input type="email" placeholder="name@company.com" className="newsletter-input" />
                <button className="btn-newsletter">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="marketing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>BrieflyAI</h3>
            <p className="footer-brand-desc">
              Empowering the world's thinkers with high-fidelity news intelligence. 
              Built for those who value time and clarity.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <Link to="/summaries">Summaries</Link>
              <Link to="/discover">Discover</Link>
              <Link to="/login">Pricing</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/help">Careers</Link>
              <Link to="/help">Privacy Policy</Link>
              <Link to="/help">Terms of Service</Link>
              <Link to="/help">Help Center</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href="mailto:press@briefly.ai">press@briefly.ai</a>
              <a href="mailto:support@briefly.ai">support@briefly.ai</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 BrieflyAI. Powered by Gemini AI.</p>
          <div className="footer-bottom-links">
            <Link to="/help">Privacy</Link>
            <Link to="/help">Terms</Link>
            <Link to="/help">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
