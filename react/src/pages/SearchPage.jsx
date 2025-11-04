import React, { useState } from 'react';
import { searchUsers } from '../api/users';
import { getOrCreateDialog } from '../api/dialogs';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSearch = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await searchUsers(phone);
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Ошибка поиска');
    } finally {
      setLoading(false);
    }
  };

  const startDialog = async (userId) => {
    try {
      const dlg = await getOrCreateDialog(userId);
      if (dlg && dlg.id) {
        navigate(`/chat/${dlg.id}`);
      }
    } catch (e) {
      setError('Не удалось создать диалог');
    }
  };

  return (
    <div data-easytag="id1-react/src/pages/SearchPage.jsx" className="max-w-3xl mx-auto">
      <h2 data-easytag="id2-react/src/pages/SearchPage.jsx" className="text-lg font-semibold mb-4">Поиск пользователей по телефону</h2>

      <div data-easytag="id3-react/src/pages/SearchPage.jsx" className="flex flex-col sm:flex-row gap-2 mb-4">
        <input data-easytag="id4-react/src/pages/SearchPage.jsx" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Введите номер или его часть" className="flex-1 bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
        <button data-easytag="id5-react/src/pages/SearchPage.jsx" onClick={onSearch} disabled={loading || !phone} className="px-4 py-2 rounded-md bg-brand hover:opacity-90 disabled:opacity-60">Найти</button>
      </div>

      {loading && <div data-easytag="id6-react/src/pages/SearchPage.jsx" className="text-muted">Загрузка…</div>}
      {error && <div data-easytag="id7-react/src/pages/SearchPage.jsx" className="text-red-400 text-sm mb-3">{error}</div>}

      <ul data-easytag="id8-react/src/pages/SearchPage.jsx" className="space-y-2">
        {results.map((u) => (
          <li data-easytag="id9-react/src/pages/SearchPage.jsx" key={u.id} className="border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <div data-easytag="id10-react/src/pages/SearchPage.jsx" className="min-w-0">
              <div data-easytag="id11-react/src/pages/SearchPage.jsx" className="font-medium truncate">{u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.phone}</div>
              <div data-easytag="id12-react/src/pages/SearchPage.jsx" className="text-sm text-muted truncate">{u.phone}</div>
            </div>
            <button data-easytag="id13-react/src/pages/SearchPage.jsx" onClick={() => startDialog(u.id)} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15">Начать чат</button>
          </li>
        ))}
      </ul>

      {!loading && results.length === 0 && phone && (
        <div data-easytag="id14-react/src/pages/SearchPage.jsx" className="text-muted">Ничего не найдено</div>
      )}
    </div>
  );
}
