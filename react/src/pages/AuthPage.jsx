import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ phone: '', password: '', first_name: '', last_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await login({ phone: form.phone, password: form.password });
        if (data && data.token) {
          localStorage.setItem('token', data.token);
        }
      } else {
        const data = await register({
          phone: form.phone,
          password: form.password,
          first_name: form.first_name || undefined,
          last_name: form.last_name || undefined,
        });
        if (data && data.token) {
          localStorage.setItem('token', data.token);
        }
      }
      navigate('/dialogs', { replace: true });
    } catch (err) {
      setError('Ошибка авторизации. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-easytag="id1-react/src/pages/AuthPage.jsx" className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div data-easytag="id2-react/src/pages/AuthPage.jsx" className="w-full max-w-md bg-card border border-white/10 rounded-2xl p-6 shadow-soft">
        <h1 data-easytag="id3-react/src/pages/AuthPage.jsx" className="text-xl font-semibold mb-4">Добро пожаловать</h1>
        <p data-easytag="id4-react/src/pages/AuthPage.jsx" className="text-sm text-muted mb-6">Войдите или зарегистрируйтесь по номеру телефона</p>

        <div data-easytag="id5-react/src/pages/AuthPage.jsx" className="flex items-center gap-2 bg-white/5 p-1 rounded-lg mb-6">
          <button data-easytag="id6-react/src/pages/AuthPage.jsx" className={`flex-1 py-2 rounded-md ${mode === 'login' ? 'bg-white/10' : ''}`} onClick={() => setMode('login')}>Вход</button>
          <button data-easytag="id7-react/src/pages/AuthPage.jsx" className={`flex-1 py-2 rounded-md ${mode === 'register' ? 'bg-white/10' : ''}`} onClick={() => setMode('register')}>Регистрация</button>
        </div>

        {error && (
          <div data-easytag="id8-react/src/pages/AuthPage.jsx" className="text-red-400 text-sm mb-3">{error}</div>
        )}

        <form data-easytag="id9-react/src/pages/AuthPage.jsx" onSubmit={onSubmit} className="space-y-4">
          <div data-easytag="id10-react/src/pages/AuthPage.jsx" className="space-y-2">
            <label data-easytag="id11-react/src/pages/AuthPage.jsx" className="text-sm text-muted">Телефон</label>
            <input data-easytag="id12-react/src/pages/AuthPage.jsx" name="phone" value={form.phone} onChange={onChange} placeholder="Например, +79991234567" className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
          </div>

          {mode === 'register' && (
            <>
              <div data-easytag="id13-react/src/pages/AuthPage.jsx" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-easytag="id14-react/src/pages/AuthPage.jsx" className="space-y-2">
                  <label data-easytag="id15-react/src/pages/AuthPage.jsx" className="text-sm text-muted">Имя</label>
                  <input data-easytag="id16-react/src/pages/AuthPage.jsx" name="first_name" value={form.first_name} onChange={onChange} placeholder="Иван" className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
                </div>
                <div data-easytag="id17-react/src/pages/AuthPage.jsx" className="space-y-2">
                  <label data-easytag="id18-react/src/pages/AuthPage.jsx" className="text-sm text-muted">Фамилия</label>
                  <input data-easytag="id19-react/src/pages/AuthPage.jsx" name="last_name" value={form.last_name} onChange={onChange} placeholder="Петров" className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
                </div>
              </div>
            </>
          )}

          <div data-easytag="id20-react/src/pages/AuthPage.jsx" className="space-y-2">
            <label data-easytag="id21-react/src/pages/AuthPage.jsx" className="text-sm text-muted">Пароль</label>
            <input data-easytag="id22-react/src/pages/AuthPage.jsx" type="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
          </div>

          <button data-easytag="id23-react/src/pages/AuthPage.jsx" type="submit" disabled={loading} className="w-full py-2 rounded-md bg-brand hover:opacity-90 active:opacity-80 transition disabled:opacity-60">
            {loading ? 'Загрузка…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
