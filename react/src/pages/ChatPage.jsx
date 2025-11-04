import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDialog } from '../api/dialogs';
import { listMessages, sendMessage } from '../api/messages';

export default function ChatPage() {
  const { id } = useParams();
  const [dialog, setDialog] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const dlg = await getDialog(id);
      setDialog(dlg);
      const resp = await listMessages(id, { limit: 50, offset: 0 });
      setMessages(Array.isArray(resp?.items) ? resp.items : []);
    } catch (e) {
      setError('Не удалось загрузить чат');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSend = async () => {
    if (!text) return;
    setSending(true);
    try {
      // Encryption will be implemented later; for now we send plaintext as ciphertext placeholder.
      await sendMessage(id, { ciphertext: text });
      setText('');
      await load();
    } catch (e) {
      setError('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-easytag="id1-react/src/pages/ChatPage.jsx" className="max-w-3xl mx-auto h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      {error && <div data-easytag="id2-react/src/pages/ChatPage.jsx" className="text-red-400 text-sm mb-2">{error}</div>}

      <div data-easytag="id3-react/src/pages/ChatPage.jsx" className="border border-white/10 rounded-xl flex-1 flex flex-col overflow-hidden bg-card">
        <div data-easytag="id4-react/src/pages/ChatPage.jsx" className="p-3 border-b border-white/10">
          <div data-easytag="id5-react/src/pages/ChatPage.jsx" className="font-medium">
            {dialog ? (dialog.participant?.first_name ? `${dialog.participant.first_name} ${dialog.participant.last_name || ''}`.trim() : dialog.participant?.phone) : 'Загрузка…'}
          </div>
          <div data-easytag="id6-react/src/pages/ChatPage.jsx" className="text-xs text-muted">Диалог №{id}</div>
        </div>

        <div data-easytag="id7-react/src/pages/ChatPage.jsx" className="flex-1 overflow-auto p-3 space-y-2">
          {loading && <div data-easytag="id8-react/src/pages/ChatPage.jsx" className="text-muted">Загрузка…</div>}
          {!loading && messages.length === 0 && (
            <div data-easytag="id9-react/src/pages/ChatPage.jsx" className="text-muted">Пока нет сообщений</div>
          )}
          {messages.map((m) => (
            <div data-easytag="id10-react/src/pages/ChatPage.jsx" key={m.id} className={`max-w-[80%] w-max px-3 py-2 rounded-lg ${m.sender === dialog?.participant?.id ? 'bg-white/5' : 'bg-brand/20 ml-auto'}`}>
              <div data-easytag="id11-react/src/pages/ChatPage.jsx" className="text-sm break-words">{m.ciphertext}</div>
              <div data-easytag="id12-react/src/pages/ChatPage.jsx" className="text-[10px] text-muted mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        <div data-easytag="id13-react/src/pages/ChatPage.jsx" className="p-3 border-t border-white/10 bg-card">
          <div data-easytag="id14-react/src/pages/ChatPage.jsx" className="flex items-center gap-2">
            <input data-easytag="id15-react/src/pages/ChatPage.jsx" value={text} onChange={(e) => setText(e.target.value)} placeholder="Введите сообщение" className="flex-1 bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
            <button data-easytag="id16-react/src/pages/ChatPage.jsx" onClick={onSend} disabled={sending || !text} className="px-4 py-2 rounded-md bg-brand hover:opacity-90 disabled:opacity-60">Отправить</button>
          </div>
        </div>
      </div>
    </div>
  );
}
