import React, { useEffect, useState } from 'react';
import { me, updateMe } from '../api/users';

export default function SettingsPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await me();
        if (active && data) {
          setForm({ first_name: data.first_name || '', last_name: data.last_name || '' });
        }
      } catch (e) {
        setError('Не удалось загрузить профиль');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      await updateMe({ first_name: form.first_name || undefined, last_name: form.last_name || undefined });
      setMsg('Сохранено');
    } catch (e) {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-easytag="id1-react/src/pages/SettingsPage.jsx" className="max-w-xl mx-auto">
      <h2 data-easytag="id2-react/src/pages/SettingsPage.jsx" className="text-lg font-semibold mb-4">Настройки</h2>

      {loading && <div data-easytag="id3-react/src/pages/SettingsPage.jsx" className="text-muted">Загрузка…</div>}
      {error && <div data-easytag="id4-react/src/pages/SettingsPage.jsx" className="text-red-400 text-sm mb-3">{error}</div>}
      {msg && <div data-easytag="id5-react/src/pages/SettingsPage.jsx" className="text-emerald-400 text-sm mb-3">{msg}</div>}

      {!loading && (
        <form data-easytag="id6-react/src/pages/SettingsPage.jsx" onSubmit={onSubmit} className="space-y-4 bg-card border border-white/10 rounded-xl p-4">
          <div data-easytag="id7-react/src/pages/SettingsPage.jsx" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-easytag="id8-react/src/pages/SettingsPage.jsx" className="space-y-2">
              <label data-easytag="id9-react/src/pages/SettingsPage.jsx" className="text-sm text-muted">Имя</label>
              <input data-easytag="id10-react/src/pages/SettingsPage.jsx" name="first_name" value={form.first_name} onChange={onChange} placeholder="Имя" className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
            </div>
            <div data-easytag="id11-react/src/pages/SettingsPage.jsx" className="space-y-2">
              <label data-easytag="id12-react/src/pages/SettingsPage.jsx" className="text-sm text-muted">Фамилия</label>
              <input data-easytag="id13-react/src/pages/SettingsPage.jsx" name="last_name" value={form.last_name} onChange={onChange} placeholder="Фамилия" className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
            </div>
          </div>
          <button data-easytag="id14-react/src/pages/SettingsPage.jsx" type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-brand hover:opacity-90 disabled:opacity-60">Сохранить</button>
        </form>
      )}
    </div>
  );
}
