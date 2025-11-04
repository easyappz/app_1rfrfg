import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDialogs } from '../api/dialogs';

export default function DialogsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listDialogs();
        if (active) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Не удалось загрузить диалоги');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const hasNew = (dlg) => {
    try {
      const lastSeen = localStorage.getItem(`last_seen_dialog_${dlg.id}`) || '';
      if (!dlg.last_message || !dlg.last_message.created_at) return false;
      if (!lastSeen) return true;
      const lm = new Date(dlg.last_message.created_at).getTime();
      const ls = new Date(lastSeen).getTime();
      return lm > ls;
    } catch (_) {
      return false;
    }
  };

  return (
    <div data-easytag="id1-react/src/pages/DialogsPage.jsx" className="max-w-3xl mx-auto">
      <div data-easytag="id2-react/src/pages/DialogsPage.jsx" className="flex items-center justify-between mb-4">
        <h2 data-easytag="id3-react/src/pages/DialogsPage.jsx" className="text-lg font-semibold">Диалоги</h2>
        <Link data-easytag="id4-react/src/pages/DialogsPage.jsx" to="/search" className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15">Новый диалог</Link>
      </div>

      {loading && <div data-easytag="id5-react/src/pages/DialogsPage.jsx" className="text-muted">Загрузка…</div>}
      {error && <div data-easytag="id6-react/src/pages/DialogsPage.jsx" className="text-red-400 text-sm mb-3">{error}</div>}

      <ul data-easytag="id7-react/src/pages/DialogsPage.jsx" className="space-y-2">
        {items.map((dlg) => {
          const newFlag = hasNew(dlg);
          return (
            <li data-easytag="id8-react/src/pages/DialogsPage.jsx" key={dlg.id} className="border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition">
              <Link data-easytag="id9-react/src/pages/DialogsPage.jsx" to={`/chat/${dlg.id}`} className="flex items-start gap-3 p-3">
                <div data-easytag="id10-react/src/pages/DialogsPage.jsx" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">{(dlg.participant?.first_name || dlg.participant?.phone || '?').slice(0,1)}</div>
                <div data-easytag="id11-react/src/pages/DialogsPage.jsx" className="flex-1 min-w-0">
                  <div data-easytag="id12-react/src/pages/DialogsPage.jsx" className="flex items-center justify-between">
                    <div data-easytag="id13-react/src/pages/DialogsPage.jsx" className="font-medium truncate flex items-center gap-2">
                      {dlg.participant?.first_name ? `${dlg.participant.first_name} ${dlg.participant.last_name || ''}`.trim() : dlg.participant?.phone}
                      {newFlag && <span data-easytag="id13a-react/src/pages/DialogsPage.jsx" className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand/20 text-[10px]">Новые</span>}
                    </div>
                    <div data-easytag="id14-react/src/pages/DialogsPage.jsx" className="text-xs text-muted">{new Date(dlg.created_at).toLocaleDateString()}</div>
                  </div>
                  <div data-easytag="id15-react/src/pages/DialogsPage.jsx" className="text-sm text-muted truncate">{dlg.last_message ? 'Зашифровано' : 'Без сообщений'}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {!loading && items.length === 0 && (
        <div data-easytag="id16-react/src/pages/DialogsPage.jsx" className="text-muted">Пока нет диалогов</div>
      )}
    </div>
  );
}
