import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth', { replace: true });
  };

  return (
    <div data-easytag="id1-react/src/components/Layout.jsx" className="min-h-screen flex flex-col bg-bg text-text">
      <header data-easytag="id2-react/src/components/Layout.jsx" className="sticky top-0 z-20 backdrop-blur border-b border-white/10 bg-bg/70">
        <div data-easytag="id3-react/src/components/Layout.jsx" className="container flex items-center justify-between h-14">
          <div data-easytag="id4-react/src/components/Layout.jsx" className="flex items-center gap-3">
            <div data-easytag="id5-react/src/components/Layout.jsx" className="w-2 h-6 bg-brand rounded-sm" />
            <Link data-easytag="id6-react/src/components/Layout.jsx" to="/dialogs" className="text-sm font-semibold tracking-wide">Easyappz Messenger</Link>
          </div>
          <nav data-easytag="id7-react/src/components/Layout.jsx" className="hidden md:flex items-center gap-2">
            <Link data-easytag="id8-react/src/components/Layout.jsx" to="/dialogs" className={`px-3 py-2 rounded-md hover:bg-white/5 ${location.pathname.startsWith('/dialogs') ? 'bg-white/10' : ''}`}>Диалоги</Link>
            <Link data-easytag="id9-react/src/components/Layout.jsx" to="/search" className={`px-3 py-2 rounded-md hover:bg-white/5 ${location.pathname.startsWith('/search') ? 'bg-white/10' : ''}`}>Поиск</Link>
            <Link data-easytag="id10-react/src/components/Layout.jsx" to="/settings" className={`px-3 py-2 rounded-md hover:bg-white/5 ${location.pathname.startsWith('/settings') ? 'bg-white/10' : ''}`}>Настройки</Link>
          </nav>
          <div data-easytag="id11-react/src/components/Layout.jsx" className="flex items-center gap-2">
            <button data-easytag="id12-react/src/components/Layout.jsx" onClick={handleLogout} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 active:bg-white/20 transition">Выйти</button>
          </div>
        </div>
      </header>

      <main data-easytag="id13-react/src/components/Layout.jsx" className="flex-1 container py-4 md:py-6">
        <div data-easytag="id14-react/src/components/Layout.jsx" className="min-h-[60vh]">{children}</div>
      </main>

      <nav data-easytag="id15-react/src/components/Layout.jsx" className="fixed md:hidden bottom-4 left-1/2 -translate-x-1/2 bg-card/90 border border-white/10 rounded-full px-2 py-1 shadow-soft backdrop-blur flex items-center gap-1">
        <Link data-easytag="id16-react/src/components/Layout.jsx" to="/dialogs" className={`px-3 py-2 text-sm rounded-full hover:bg-white/5 ${location.pathname.startsWith('/dialogs') ? 'bg-white/10' : ''}`}>Диалоги</Link>
        <Link data-easytag="id17-react/src/components/Layout.jsx" to="/search" className={`px-3 py-2 text-sm rounded-full hover:bg-white/5 ${location.pathname.startsWith('/search') ? 'bg-white/10' : ''}`}>Поиск</Link>
        <Link data-easytag="id18-react/src/components/Layout.jsx" to="/settings" className={`px-3 py-2 text-sm rounded-full hover:bg-white/5 ${location.pathname.startsWith('/settings') ? 'bg-white/10' : ''}`}>Настройки</Link>
      </nav>

      <footer data-easytag="id19-react/src/components/Layout.jsx" className="h-6" />
    </div>
  );
}
