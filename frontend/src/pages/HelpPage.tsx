import type React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { HelpCircle, BookOpen, Mail, Shield, FileText, MessageCircle, ChevronRight, ExternalLink } from 'lucide-react';
import './DashboardPage.css';

const faqs = [
  { q: 'What is BrieflyAI?', a: 'BrieflyAI is an AI-powered news summarization platform that uses Google Gemini to distill thousands of articles into concise, actionable summaries across 8+ categories.' },
  { q: 'How does the AI summary work?', a: 'When you open an article, click "Summarize with AI" to generate an executive summary powered by Google Gemini. The AI extracts key facts, sentiments, and timelines from the full content.' },
  { q: 'Is there a free plan?', a: 'Yes! You can read AI summaries of all articles for free. A test account is available — just click "Test User Auto-Login" on the Sign In page.' },
  { q: 'Can I customize news categories?', a: 'Go to Settings > Preferences to select your preferred categories and languages. Your feed will prioritize news matching your interests.' },
  { q: 'How do I search for specific topics?', a: 'Use the Discover page to browse by category or use the search bar to find articles by title, description, or source.' },
  { q: 'How is my data protected?', a: 'Your data is encrypted in transit and at rest. We never share your personal information with third parties. See our Privacy Policy for details.' },
];

const HelpPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting bg-primary text-white">
        <h1>Help Center</h1>
        <p>Everything you need to get the most out of BrieflyAI.</p>
      </div>

      <div className="dashboard-content">
        <div className="main-feed">
          <div className="feed-header">
            <h2>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, i) => (
              <details key={i} style={{
                background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)', overflow: 'hidden',
              }}>
                <summary style={{
                  padding: '1.25rem', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.9375rem', display: 'flex', alignItems: 'center',
                  gap: '0.75rem', color: 'var(--color-text-primary)',
                }}>
                  <HelpCircle size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  {faq.q}
                  <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.4, transition: 'transform 0.2s' }} />
                </summary>
                <div style={{
                  padding: '0 1.25rem 1.25rem', color: 'var(--color-text-secondary)',
                  fontSize: '0.9375rem', lineHeight: 1.7, marginLeft: '2.5rem',
                }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="feed-header" style={{ marginTop: '2.5rem' }}>
            <h2>Quick Links</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { icon: <BookOpen size={20} />, title: 'Getting Started Guide', desc: 'Learn the basics of BrieflyAI', href: '/discover' },
              { icon: <Shield size={20} />, title: 'Privacy Policy', desc: 'How we handle your data', href: '#' },
              { icon: <FileText size={20} />, title: 'Terms of Service', desc: 'Our terms and conditions', href: '#' },
              { icon: <MessageCircle size={20} />, title: 'Community Forum', desc: 'Join the discussion', href: '#' },
            ].map((item, i) => (
              <Link key={i} to={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)', textDecoration: 'none',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-primary)' }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{item.desc}</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>

        <div className="side-feed">
          <div className="side-widget glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <Mail size={32} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
            <h3>Need more help?</h3>
            <p className="text-sm text-muted mt-2 mb-4">
              Our support team typically responds within 2 hours during business hours.
            </p>
            <a href="mailto:support@briefly.ai" className="btn btn-primary w-full" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
              <Mail size={16} /> Contact Support
            </a>
          </div>

          <div className="side-widget glass-panel">
            <h3>System Status</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'API Status', status: 'Operational', color: '#10b981' },
                { label: 'AI Service', status: 'Operational', color: '#10b981' },
                { label: 'Database', status: 'Operational', color: '#10b981' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: item.color, fontWeight: 500 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
