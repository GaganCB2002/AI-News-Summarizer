import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../services/api';
import { Button } from '../../components/Button';
import {
  Search, ChevronLeft, ChevronRight, Edit3,
  UserX, UserCheck, Users, Trash2, Plus, X, Shield, Activity,
  AlertTriangle, AlertCircle, Clock,
} from 'lucide-react';
import './AdminUsers.css';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  profile_image_url?: string;
  created_at: string;
  last_login?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  target: string;
  created_at: string;
}

const PAGE_SIZE = 10;

const AdminUsers: React.FC = () => {
  useDocumentTitle('Manage Users');
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', full_name: '', password: '', is_superuser: false });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showActivity, setShowActivity] = useState<AdminUser | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ user: AdminUser; action: 'suspend' | 'activate' | 'delete' } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (filter === 'active') params.is_active = true;
      else if (filter === 'inactive') params.is_active = false;
      else if (filter === 'admin') params.is_superuser = true;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.items ?? res.data ?? []);
      setTotal(res.data.total ?? res.data.length ?? 0);
    } catch {
      setError('Failed to load users.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openCreateModal = () => {
    setEditUser(null);
    setFormData({ username: '', email: '', full_name: '', password: '', is_superuser: false });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (u: AdminUser) => {
    setEditUser(u);
    setFormData({ username: u.username, email: u.email, full_name: u.full_name || '', password: '', is_superuser: u.is_superuser });
    setModalError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');
    try {
      if (editUser) {
        const payload: Record<string, unknown> = {
          username: formData.username,
          email: formData.email,
          full_name: formData.full_name,
          is_superuser: formData.is_superuser,
        };
        if (formData.password) payload.password = formData.password;
        await api.put(`/admin/users/${editUser.id}`, payload);
      } else {
        await api.post('/admin/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      const { user: target, action } = confirmAction;
      if (action === 'delete') {
        await api.delete(`/admin/users/${target.id}`);
      } else {
        await api.put(`/admin/users/${target.id}`, { is_active: action === 'activate' });
      }
      setConfirmAction(null);
      fetchUsers();
    } catch {
      setError('Action failed.');
    } finally {
      setConfirmLoading(false);
    }
  };

  const openActivity = async (u: AdminUser) => {
    setShowActivity(u);
    setActivityLoading(true);
    setActivityLog([]);
    try {
      const res = await api.get(`/admin/users/${u.id}/activity`);
      setActivityLog(res.data ?? []);
    } catch {
      setActivityLog([]);
    } finally {
      setActivityLoading(false);
    }
  };

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user?.is_superuser) return <Navigate to="/login" />;

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>Manage Users</h1>
        <Button variant="primary" size="sm" onClick={openCreateModal}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {error && (
        <div className="admin-error-state">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="users-toolbar">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="users-search-input"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="users-filter-select" value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="users-table-wrapper glass-panel">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Joined</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className="admin-skeleton" style={{ width: j === 0 ? '140px' : '80px', height: '16px' }} /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="admin-empty-state">
                    <Users size={32} />
                    <p>No users found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      {u.profile_image_url ? (
                        <img src={u.profile_image_url} alt="" className="user-avatar-table" />
                      ) : (
                        <div className="user-avatar-table" style={{ backgroundColor: u.is_superuser ? 'var(--color-secondary)' : 'var(--color-primary)' }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="user-name-cell">{u.full_name || u.username}</div>
                        <div className="user-email-cell">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="user-email-cell">{u.email}</td>
                  <td>
                    <span className={`user-status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                      <span className={`user-status-dot ${u.is_active ? 'active' : 'inactive'}`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`user-role-badge ${u.is_superuser ? 'admin' : 'member'}`}>
                      {u.is_superuser ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div className="user-actions">
                      <button className="user-action-btn" title="Edit" onClick={() => openEditModal(u)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="user-action-btn" title="Activity" onClick={() => openActivity(u)}>
                        <Activity size={14} />
                      </button>
                      {u.is_active ? (
                        <button className="user-action-btn danger" title="Suspend" onClick={() => setConfirmAction({ user: u, action: 'suspend' })}>
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button className="user-action-btn" title="Activate" onClick={() => setConfirmAction({ user: u, action: 'activate' })}>
                          <UserCheck size={14} />
                        </button>
                      )}
                      <button className="user-action-btn danger" title="Delete" onClick={() => setConfirmAction({ user: u, action: 'delete' })}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="users-pagination">
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
          <span className="pagination-info">{total} total users</span>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editUser ? 'Edit User' : 'Create User'}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Username</label>
                    <input type="text" value={formData.username} onChange={e => setFormData(f => ({ ...f, username: e.target.value }))} required />
                  </div>
                  <div className="modal-form-group">
                    <label>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Full Name</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="modal-form-group">
                  <label>{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                  <input type="password" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} required={!editUser} minLength={8} />
                </div>
                <div className="modal-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.is_superuser} onChange={e => setFormData(f => ({ ...f, is_superuser: e.target.checked }))} style={{ width: 'auto' }} />
                    <Shield size={14} /> Administrator privileges
                  </label>
                </div>
                {modalError && (
                  <div className="settings-message-banner error">{modalError}</div>
                )}
              </div>
              <div className="modal-footer">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showActivity && (
        <div className="modal-overlay" onClick={() => setShowActivity(null)}>
          <div className="modal-content user-activity-view" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Activity: {showActivity.username}</h2>
              <button className="modal-close-btn" onClick={() => setShowActivity(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {activityLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', alignItems: 'center' }}>
                    <div className="admin-skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="admin-skeleton" style={{ width: '180px', height: '14px', marginBottom: '4px' }} />
                      <div className="admin-skeleton" style={{ width: '80px', height: '11px' }} />
                    </div>
                  </div>
                ))
              ) : activityLog.length === 0 ? (
                <div className="admin-empty-state">
                  <Clock size={32} />
                  <p>No activity logged.</p>
                </div>
              ) : (
                activityLog.map((log) => (
                  <div key={log.id} className="user-activity-item">
                    <div className="activity-log-icon"><Activity size={14} /></div>
                    <div>
                      <div className="activity-log-text">{log.action} {log.target}</div>
                      <div className="activity-log-time">{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Action</h2>
              <button className="modal-close-btn" onClick={() => setConfirmAction(null)}><X size={18} /></button>
            </div>
            <div className="confirm-dialog">
              <AlertTriangle size={32} style={{ color: '#f59e0b', marginBottom: '0.75rem' }} />
              <p>
                {confirmAction.action === 'delete'
                  ? `Are you sure you want to delete "${confirmAction.user.username}"? This cannot be undone.`
                  : confirmAction.action === 'suspend'
                    ? `Are you sure you want to suspend "${confirmAction.user.username}"?`
                    : `Are you sure you want to activate "${confirmAction.user.username}"?`}
              </p>
              <div className="confirm-dialog-actions">
                <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button
                  variant={confirmAction.action === 'delete' ? 'secondary' : 'primary'}
                  disabled={confirmLoading}
                  onClick={handleConfirm}
                >
                  {confirmLoading ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
