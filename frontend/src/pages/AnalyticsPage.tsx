import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  BookOpen, Clock, FileText, TrendingUp, Activity, Award,
} from 'lucide-react';
import './AnalyticsPage.css';

interface MyAnalytics {
  total_articles_read: number;
  total_reading_time_minutes: number;
  total_summaries_generated: number;
  category_breakdown: { name: string; count: number }[];
  daily_activity: { date: string; reads: number; time_seconds: number }[];
  top_articles: {
    id: string; title: string; category: string;
    read_count: number; total_time_seconds: number;
  }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const AnalyticsPage: React.FC = () => {
  useDocumentTitle('Analytics');
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<MyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/me');
        setData(res.data);
      } catch {
        setError('Failed to load analytics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  if (authLoading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h2>My Analytics</h2>
          <p className="text-muted">Track your reading activity and article insights</p>
        </div>
        <div className="analytics-skeleton">
          <div className="skeleton-row">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-icon" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
          <div className="skeleton-chart" />
          <div className="skeleton-row">
            <div className="skeleton-chart half" />
            <div className="skeleton-chart half" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h2>My Analytics</h2>
        </div>
        <div className="error-state">
          <TrendingUp size={48} className="error-icon" />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h2>My Analytics</h2>
        </div>
        <div className="empty-state">
          <Activity size={48} className="empty-icon" />
          <h3>No Activity Yet</h3>
          <p>Start reading articles and generating summaries to see your analytics.</p>
        </div>
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  };

  const pieData = data.category_breakdown.length > 0 ? data.category_breakdown : [{ name: 'No Data', count: 1 }];
  const hasActivity = data.daily_activity.some(d => d.reads > 0);
  const hasArticles = data.top_articles.length > 0;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h2>My Analytics</h2>
        <p className="text-muted">Track your reading activity and article insights</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.total_articles_read}</span>
            <span className="stat-label">Articles Read</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatTime(data.total_reading_time_minutes)}</span>
            <span className="stat-label">Reading Time</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.total_summaries_generated}</span>
            <span className="stat-label">Summaries Generated</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
            <Award size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.category_breakdown.length}</span>
            <span className="stat-label">Categories Explored</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <Activity size={18} />
            <h3>Daily Reading Activity (7 Days)</h3>
          </div>
          <div className="chart-body">
            {hasActivity ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.daily_activity} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                      borderRadius: '8px', fontSize: '13px',
                    }}
                    labelFormatter={((v: string) => new Date(v).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })) as any}
                  />
                  <Bar dataKey="reads" name="Articles Read" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="time_seconds" name="Time (seconds)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <Activity size={32} />
                <p>No reading activity in the last 7 days</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <TrendingUp size={18} />
            <h3>Category Breakdown</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  dataKey="count" nameKey="name"
                  paddingAngle={3}
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                    borderRadius: '8px', fontSize: '13px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {hasArticles && (
        <div className="chart-card glass-panel" style={{ marginTop: '1.5rem' }}>
          <div className="chart-card-header">
            <Award size={18} />
            <h3>Top Articles You Read Most</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.top_articles.map(a => ({
                  ...a,
                  displayTitle: a.title.length > 40 ? a.title.slice(0, 40) + '...' : a.title,
                }))}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis
                  type="category"
                  dataKey="displayTitle"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                    borderRadius: '8px', fontSize: '13px',
                  }}
                  formatter={((value: number) => [
                    `${Math.round(value / 60)} min`,
                    'Activity',
                  ]) as any}
                />
                <Bar dataKey="read_count" name="Times Read" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="total_time_seconds" name="Total Time" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!hasArticles && data.total_articles_read > 0 && (
        <div className="chart-card glass-panel" style={{ marginTop: '1.5rem' }}>
          <div className="chart-card-header">
            <Activity size={18} />
            <h3>Reading Time Trend</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.daily_activity} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                    borderRadius: '8px', fontSize: '13px',
                  }}
                  labelFormatter={((v: string) => new Date(v).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })) as any}
                />
                <Line type="monotone" dataKey="time_seconds" name="Reading Time (s)" stroke="#6366f1"
                  strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
