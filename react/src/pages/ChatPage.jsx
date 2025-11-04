import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDialog } from '../api/dialogs';
import { listMessages, sendMessage } from '../api/messages';
import { deriveKey, encryptString, decryptString } from '../utils/crypto';

export default function ChatPage() {
  const { id } = useParams();
  const dialogId = String(id);

  const [dialog, setDialog] = useState(null);
  const [messages, setMessages] = useState([]); // items with optional plaintext
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);

  const lastCreatedAtRef = useRef(null);
  const storageKeyPass = `chat_key_${dialogId}`;
  const salt = `dialog:${dialogId}`;

  const setLastSeenNow = () => {
    try {
      localStorage.setItem(`last_seen_dialog_${dialogId}`, new Date().toISOString());
    } catch (_) {
      // ignore
    }
  };

  const loadPassphraseIfAny = async () => {
    const stored = localStorage.getItem(storageKeyPass);
    if (!stored) {
      setShowKeyPrompt(true);
      setCryptoKey(null);
      return null;
    }
    try {
      const k = await deriveKey(stored, salt);
      setCryptoKey(k);
      setShowKeyPrompt(false);
      return k;
    } catch (e) {
      setCryptoKey(null);
      setShowKeyPrompt(true);
      return null;
    }
  };

  const decryptMessages = async (items, key) => {
    if (!Array.isArray(items)) return [];
    if (!key) {
      return items.map((m) => ({ ...m, plaintext: null, notDecrypted: true }));
    }
    const out = [];
    for (let i = 0; i < items.length; i += 1) {
      const m = items[i];
      try {
        const pt = await decryptString(m.ciphertext, key);
        out.push({ ...m, plaintext: pt, notDecrypted: false });
      } catch (_) {
        out.push({ ...m, plaintext: null, notDecrypted: true });
      }
    }
    return out;
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const dlg = await getDialog(dialogId);
      setDialog(dlg);
      const resp = await listMessages(dialogId, { limit: 50, offset: 0 });
      const key = cryptoKey || (await loadPassphraseIfAny());
      const processed = await decryptMessages(resp?.items || [], key);
      setMessages(processed);
      if (processed.length) {
        lastCreatedAtRef.current = processed[processed.length - 1].created_at;
      }
      setLastSeenNow();
    } catch (e) {
      setError('Не удалось загрузить чат');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogId]);

  useEffect(() => {
    // re-decrypt if key becomes available/changes
    (async () => {
      if (!messages.length) return;
      const processed = await decryptMessages(messages.map((m) => ({ id: m.id, dialog: m.dialog, sender: m.sender, ciphertext: m.ciphertext, created_at: m.created_at })), cryptoKey);
      setMessages(processed);
      if (processed.length) {
        lastCreatedAtRef.current = processed[processed.length - 1].created_at;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoKey]);

  useEffect(() => {
    setLastSeenNow();
  }, [messages]);

  useEffect(() => {
    let timer = null;
    const tick = async () => {
      try {
        const after = lastCreatedAtRef.current || undefined;
        const resp = await listMessages(dialogId, after ? { after } : { limit: 50, offset: 0 });
        const items = Array.isArray(resp?.items) ? resp.items : [];
        if (items.length) {
          const processed = await decryptMessages(items, cryptoKey);
          setMessages((prev) => {
            const merged = [...prev, ...processed];
            if (merged.length) {
              lastCreatedAtRef.current = merged[merged.length - 1].created_at;
            }
            return merged;
          });
          setLastSeenNow();
        }
      } catch (_) {
        // ignore polling errors
      }
    };
    timer = setInterval(tick, 5000);
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogId, cryptoKey]);

  const onSend = async () => {
    if (!text) return;
    setSending(true);
    try {
      let key = cryptoKey;
      if (!key) {
        key = await loadPassphraseIfAny();
        if (!key) {
          setSending(false);
          return; // Key prompt will be shown
        }
      }
      const payloadCiphertext = await encryptString(text, key);
      const created = await sendMessage(dialogId, { ciphertext: payloadCiphertext });
      const processed = await decryptMessages([created], key);
      setMessages((prev) => [...prev, ...processed]);
      setText('');
      setLastSeenNow();
      if (processed.length) {
        lastCreatedAtRef.current = processed[processed.length - 1].created_at;
      }
    } catch (e) {
      setError('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const saveKeyAndProceed = async () => {
    if (!keyInput) return;
    try {
      localStorage.setItem(storageKeyPass, keyInput);
      const k = await deriveKey(keyInput, salt);
      setCryptoKey(k);
      setShowKeyPrompt(false);
      setKeyInput('');
    } catch (_) {
      // If derivation fails, keep prompt open
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
          <div data-easytag="id6-react/src/pages/ChatPage.jsx" className="text-xs text-muted">Диалог №{dialogId}</div>
        </div>

        <div data-easytag="id7-react/src/pages/ChatPage.jsx" className="flex-1 overflow-auto p-3 space-y-2">
          {loading && <div data-easytag="id8-react/src/pages/ChatPage.jsx" className="text-muted">Загрузка…</div>}
          {!loading && messages.length === 0 && (
            <div data-easytag="id9-react/src/pages/ChatPage.jsx" className="text-muted">Пока нет сообщений</div>
          )}
          {messages.map((m) => (
            <div data-easytag="id10-react/src/pages/ChatPage.jsx" key={m.id} className={`max-w-[80%] w-max px-3 py-2 rounded-lg ${m.sender === dialog?.participant?.id ? 'bg-white/5' : 'bg-brand/20 ml-auto'}`}>
              <div data-easytag="id11-react/src/pages/ChatPage.jsx" className="text-sm break-words">{m.plaintext !== null && m.plaintext !== undefined ? m.plaintext : 'Сообщение не расшифровано (неверный ключ)'}</div>
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

      {showKeyPrompt && (
        <div data-easytag="id17-react/src/pages/ChatPage.jsx" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div data-easytag="id18-react/src/pages/ChatPage.jsx" className="w-full max-w-md bg-card border border-white/10 rounded-xl p-4">
            <h3 data-easytag="id19-react/src/pages/ChatPage.jsx" className="text-base font-semibold mb-2">Ключ шифрования</h3>
            <p data-easytag="id20-react/src/pages/ChatPage.jsx" className="text-sm text-muted mb-4">Введите общий ключ для этого диалога. Он сохранится только у вас в браузере. Ключ не отправляется на сервер.</p>
            <input data-easytag="id21-react/src/pages/ChatPage.jsx" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Введите ключ-пароль" className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand mb-3" />
            <div data-easytag="id22-react/src/pages/ChatPage.jsx" className="flex items-center justify-end gap-2">
              <button data-easytag="id23-react/src/pages/ChatPage.jsx" onClick={saveKeyAndProceed} className="px-4 py-2 rounded-md bg-brand hover:opacity-90 disabled:opacity-60" disabled={!keyInput}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
