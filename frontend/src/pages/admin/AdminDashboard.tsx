import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../services/api';
import { Button } from '../../components/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, FileText, Activity, Database, HeartPulse, RefreshCw,
  UserPlus, UserCheck, Clock, AlertCircle,
} from 'lucide-react';
import './AdminDashboard.css';

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_articles: number;
  total_summaries: number;
  api_health: number;
  storage_used: number;
  storage_total: number;
  api_uptime: number;
}

interface UserGrowthPoint {
  month: string;
  count: number;
}

interface CategoryDist {
  name: string;
  value: number;
}

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  target: string;
  time: string;
  type: 'user' | 'article' | 'summary' | 'system';
}

const defaultStats: DashboardStats = {
  total_users: 0,
  active_users: 0,
  total_articles: 0,
  total_summaries: 0,
  api_health: 100,
  storage_used: 0,
  storage_total: 100,
  api_uptime: 100,
};

const statCards = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: 'stat-icon-blue', format: (v: number) => v.toLocaleString() },
  { key: 'active_users', label: 'Active Users', icon: UserCheck, color: 'stat-icon-green', format: (v: number) => v.toLocaleString() },
  { key: 'total_articles', label: 'Total Articles', icon: FileText, color: 'stat-icon-purple', format: (v: number) => v.toLocaleString() },
  { key: 'total_summaries', label: 'Total Summaries', icon: Activity, color: 'stat-icon-orange', format: (v: number) => v.toLocaleString() },
  { key: 'api_health', label: 'API Health', icon: HeartPulse, color: 'stat-icon-green', format: (v: number) => `${v}%` },
  { key: 'storage_used', label: 'Storage', icon: Database, color: 'stat-icon-blue', format: (v: number, s: DashboardStats) => {
    const pct = s.storage_total > 0 ? Math.round((v / s.storage_total) * 100) : 0;
    return `${pct}%`;
  }},
];

const PIE_COLORS = ['#0e5ef5', '#633cf7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const skeletonBlock = (width: string, height: string, mb?: string) => (
  <div className="admin-skeleton" style={{ width, height, marginBottom: mb || '0' }} />
);

const AdminDashboard: React.FC = () => {
  useDocumentTitle('Admin Dashboard');
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryDist[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [statsRes, growthRes, catRes, activityRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: defaultStats })),
        api.get('/admin/stats/user-growth').catch(() => ({ data: [] })),
        api.get('/admin/stats/category-distribution').catch(() => ({ data: [] })),
        api.get('/admin/activity?limit=10').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data ?? defaultStats);
      setUserGrowth(growthRes.data ?? []);
      setCategoryDist(catRes.data ?? []);
      setActivity(activityRes.data ?? []);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const storageStat = statCards[5];
  const storageDisplay = storageStat.format(stats.storage_used, stats);

  const getHealthColor = (val: number) => {
    if (val >= 90) return 'health-bar-green';
    if (val >= 70) return 'health-bar-yellow';
    return 'health-bar-red';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserPlus size={14} />;
      case 'article': return <FileText size={14} />;
      case 'summary': return <Activity size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getActivityIconClass = (type: string) => {
    switch (type) {
      case 'user': return 'activity-icon-blue';
      case 'article': return 'activity-icon-purple';
      case 'summary': return 'activity-icon-green';
      default: return 'activity-icon-orange';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Overview of system statistics and activity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="admin-error-state">
          <AlertCircle size={24} />
          <span>{error}</span>
          <Button variant="primary" size="sm" onClick={fetchData}>Retry</Button>
        </div>
      )}

      <div className="stats-cards">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card glass-panel">
              <div className="stat-card-header">
                {skeletonBlock('100px', '12px')}
                {skeletonBlock('20px', '20px')}
              </div>
              <div className="stat-card-body">
                {skeletonBlock('60px', '32px')}
              </div>
            </div>
          ))
        ) : (
          statCards.map((card) => {
            const Icon = card.icon;
            const value = stats[card.key as keyof DashboardStats] as number;
            const display = card.key === 'storage_used' ? storageDisplay : (card.format as (v: number) => string)(value);
            return (
              <div key={card.key} className="stat-card glass-panel">
                <div className="stat-card-header">
                  <span className="stat-label">{card.label}</span>
                  <Icon size={18} className={card.color} />
                </div>
                <div className="stat-card-body">
                  <span className="stat-value">{display}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="admin-charts-grid">
        <div className="admin-chart-card glass-panel">
          <h3>User Growth</h3>
          {isLoading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 16px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="admin-skeleton" style={{ flex: 1, height: `${40 + Math.random() * 60}%`, borderRadius: '4px 4px 0 0' }} />
              ))}
            </div>
          ) : userGrowth.length === 0 ? (
            <div className="admin-empty-state">
              <BarChart />
              <p>No user growth data yet.</p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="admin-chart-card glass-panel">
          <h3>News by Category</h3>
          {isLoading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="admin-skeleton" style={{ width: 140, height: 140, borderRadius: '50%' }} />
            </div>
          ) : categoryDist.length === 0 ? (
            <div className="admin-empty-state">
              <PieChart />
              <p>No category data yet.</p>
            </div>
          ) : (
            <div className="chart-container-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryDist.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                    formatter={(value: string) => <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="admin-chart-card glass-panel">
          <h3>System Health</h3>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {skeletonBlock('80px', '12px')}
                    {skeletonBlock('40px', '12px')}
                  </div>
                  {skeletonBlock('100%', '8px', '0')}
                </div>
              ))}
            </div>
          ) : (
            <div className="health-gauge-list">
              <div className="health-gauge-item">
                <div className="health-gauge-header">
                  <span>API Health</span>
                  <span>{stats.api_health}%</span>
                </div>
                <div className="health-bar-track">
                  <div className={`health-bar-fill ${getHealthColor(stats.api_health)}`} style={{ width: `${stats.api_health}%` }} />
                </div>
              </div>
              <div className="health-gauge-item">
                <div className="health-gauge-header">
                  <span>API Uptime</span>
                  <span>{stats.api_uptime}%</span>
                </div>
                <div className="health-bar-track">
                  <div className={`health-bar-fill ${getHealthColor(stats.api_uptime)}`} style={{ width: `${stats.api_uptime}%` }} />
                </div>
              </div>
              <div className="health-gauge-item">
                <div className="health-gauge-header">
                  <span>Storage</span>
                  <span>{storageDisplay}</span>
                </div>
                <div className="health-bar-track">
                  <div className={`health-bar-fill ${getHealthColor(Number(storageDisplay.replace('%', '')))}`}
                    style={{ width: storageDisplay }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="admin-bottom-grid">
        <div className="admin-chart-card glass-panel">
          <h3>Recent Activity</h3>
          {isLoading ? (
            <div className="recent-activity-feed">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                  {skeletonBlock('32px', '32px', '0')}
                  <div style={{ flex: 1 }}>
                    {skeletonBlock('140px', '14px', '4px')}
                    {skeletonBlock('80px', '11px', '0')}
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="admin-empty-state">
              <Activity size={32} />
              <p>No recent activity.</p>
            </div>
          ) : (
            <div className="recent-activity-feed">
              {activity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className={`activity-icon-wrapper ${getActivityIconClass(item.type)}`}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{item.user}</strong> {item.action} <em>{item.target}</em>
                    </div>
                    <div className="activity-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-chart-card glass-panel">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button variant="outline" fullWidth onClick={() => window.location.href = '/admin/users'}>
              <Users size={16} /> Manage Users
            </Button>
            <Button variant="outline" fullWidth onClick={() => window.location.href = '/admin/content'}>
              <FileText size={16} /> Review Content
            </Button>
            <Button variant="outline" fullWidth onClick={() => window.location.href = '/admin/settings'}>
              <Activity size={16} /> System Settings
            </Button>
            <Button variant="outline" fullWidth onClick={() => window.location.href = '/admin/theme'}>
              <HeartPulse size={16} /> Theme Manager
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
