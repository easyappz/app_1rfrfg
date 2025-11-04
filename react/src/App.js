import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DialogsPage from './pages/DialogsPage';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth() {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return <Layout><Outlet /></Layout>;
}

function RedirectIfAuthed({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    return <Navigate to="/dialogs" replace />;
  }
  return children;
}

function InitialRedirect() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return <Navigate to={token ? '/dialogs' : '/auth'} replace />;
}

export default function App() {
  return (
    <div data-easytag="id1-react/src/App.js" className="min-h-screen bg-bg text-text">
      <Routes>
        <Route index element={<InitialRedirect />} />
        <Route path="/auth" element={<RedirectIfAuthed><AuthPage /></RedirectIfAuthed>} />

        <Route element={<RequireAuth />}>
          <Route path="/dialogs" element={<DialogsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
