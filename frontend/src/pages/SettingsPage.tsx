import type React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/Button';
import { User, Lock, Bell, Save, CheckCircle, AlertCircle, Camera, Shield, Calendar } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getImageUrl } from '../config';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  useDocumentTitle('Settings');
  const { user, isLoading: authLoading, updateUser } = useAuth();

  const [categories, setCategories] = useState('');
  const [languages, setLanguages] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordMessageType, setPasswordMessageType] = useState<'success' | 'error'>('success');

  const [profileEmail, setProfileEmail] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileFullName, setProfileFullName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileMessageType, setProfileMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await api.get('/preferences');
        if (response.data) {
          setCategories(response.data.categories?.join(', ') || '');
          setLanguages(response.data.languages?.join(', ') || '');
          setSummaryLength(response.data.summary_length || 'medium');
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchPreferences();
      setProfileEmail(user.email || '');
      setProfileUsername(user.username || '');
      setProfileFullName(user.full_name || '');
      setProfileImage(user.profile_image_url || null);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await api.put('/preferences', {
        categories: categories.split(',').map(s => s.trim()).filter(Boolean),
        languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        summary_length: summaryLength,
      });
      setMessage('Preferences saved successfully!');
      setMessageType('success');
    } catch {
      setMessage('Failed to save preferences.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');
    try {
      await api.put('/auth/me', {
        email: profileEmail,
        username: profileUsername,
        full_name: profileFullName
      });
      updateUser({
        email: profileEmail,
        username: profileUsername,
        full_name: profileFullName,
      });
      setProfileMessage('Profile updated successfully!');
      setProfileMessageType('success');
    } catch (err: any) {
      setProfileMessage(err.response?.data?.message || 'Failed to update profile.');
      setProfileMessageType('error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploadingImage(true);
    try {
      const response = await api.post('/auth/me/profile-image', formData);
      setProfileImage(response.data.profile_image_url);
      updateUser({ profile_image_url: response.data.profile_image_url });
      setProfileMessage('Profile picture updated successfully!');
      setProfileMessageType('success');
    } catch (err: any) {
      setProfileMessage(err.response?.data?.message || 'Failed to upload image.');
      setProfileMessageType('error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match.');
      setPasswordMessageType('error');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters.');
      setPasswordMessageType('error');
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
      setPasswordMessage('Password changed successfully!');
      setPasswordMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMessage('Failed to change password. Check your current password.');
      setPasswordMessageType('error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p className="text-muted">Manage your account, preferences, and security.</p>
      </div>

      <div className="settings-grid">
        <div className="glass-panel settings-card">
          <div className="settings-card-header">
            <User size={20} className="text-primary" />
            <h3>Profile Information</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
              backgroundColor: 'var(--color-bg-elevated)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
              border: '2px solid var(--color-border)', position: 'relative'
            }}>
              {profileImage ? (
                <img src={getImageUrl(profileImage) || ''} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} className="text-muted" />
              )}
            </div>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.875rem' }}>
              <Camera size={16} />
              {isUploadingImage ? 'Uploading...' : 'Change Photo'}
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
            </label>
          </div>

          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="profileEmail">Email</label>
              <input type="email" id="profileEmail" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="profileUsername">Username</label>
              <input type="text" id="profileUsername" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="profileFullName">Full Name</label>
              <input type="text" id="profileFullName" value={profileFullName} onChange={(e) => setProfileFullName(e.target.value)} />
            </div>
            {profileMessage && (
              <div className={`settings-message ${profileMessageType}`}>
                {profileMessageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {profileMessage}
              </div>
            )}
            <Button type="submit" variant="primary" disabled={isSavingProfile}>
              <Save size={16} />{isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </div>

        <div className="glass-panel settings-card">
          <div className="settings-card-header">
            <Bell size={20} className="text-secondary" />
            <h3>News & Summary Preferences</h3>
          </div>
          {isLoading ? (
            <p className="text-muted">Loading preferences...</p>
          ) : (
            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-group">
                <label htmlFor="categories">Preferred Categories</label>
                <input type="text" id="categories" value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="technology, business, science" />
                <span className="form-hint">Comma-separated list of categories</span>
              </div>
              <div className="form-group">
                <label htmlFor="languages">Preferred Languages</label>
                <input type="text" id="languages" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="en, fr, es" />
                <span className="form-hint">Comma-separated language codes</span>
              </div>
              <div className="form-group">
                <label htmlFor="summaryLength">Summary Length</label>
                <select id="summaryLength" value={summaryLength} onChange={(e) => setSummaryLength(e.target.value)}>
                  <option value="short">Short (1-2 sentences)</option>
                  <option value="medium">Medium (1 paragraph)</option>
                  <option value="long">Long (Detailed bullet points)</option>
                </select>
              </div>
              {message && (
                <div className={`settings-message ${messageType}`}>
                  {messageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {message}
                </div>
              )}
              <Button type="submit" variant="primary" disabled={isSaving}>
                <Save size={16} />{isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </form>
          )}
        </div>

        <div className="glass-panel settings-card">
          <div className="settings-card-header">
            <Lock size={20} className="text-success" />
            <h3>Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {passwordMessage && (
              <div className={`settings-message ${passwordMessageType}`}>
                {passwordMessageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {passwordMessage}
              </div>
            )}
            <Button type="submit" variant="secondary" disabled={isChangingPassword}>
              <Lock size={16} />{isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </div>

        <div className="glass-panel settings-card">
          <div className="settings-card-header">
            <Shield size={20} className="text-info" />
            <h3>Account Information</h3>
          </div>
          <div className="account-info-grid">
            <div className="account-info-item">
              <span className="account-info-label">User ID</span>
              <span className="account-info-value account-info-mono">{user.id}</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-label">Status</span>
              <span className="account-info-value">
                <span className={`status-badge ${user.is_active !== false ? 'active' : 'inactive'}`}>
                  {user.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </span>
            </div>
            <div className="account-info-item">
              <span className="account-info-label">Role</span>
              <span className="account-info-value">{user.is_superuser ? 'Administrator' : 'Member'}</span>
            </div>
            {user.created_at && (
              <div className="account-info-item">
                <span className="account-info-label">
                  <Calendar size={14} /> Member Since
                </span>
                <span className="account-info-value">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
