import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import MarketingLayout from './layouts/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SummariesPage from './pages/SummariesPage';
import ArchivePage from './pages/ArchivePage';
import SettingsPage from './pages/SettingsPage';
import ArticlePage from './pages/ArticlePage';
import HelpPage from './pages/HelpPage';
import BookmarksPage from './pages/BookmarksPage';
import HistoryPage from './pages/HistoryPage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminThemeManager from './pages/admin/AdminThemeManager';
import AdminContent from './pages/admin/AdminContent';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<HomePage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/summaries" element={<SummariesPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Route>

            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/theme" element={<AdminThemeManager />} />
              <Route path="/admin/content" element={<AdminContent />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;