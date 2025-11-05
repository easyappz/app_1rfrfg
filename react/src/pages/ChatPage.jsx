import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDialog } from '../api/dialogs';
import { listMessages, sendMessage, IMAGE_MAX_BYTES } from '../api/messages';
import { deriveKey, encryptString, decryptString, encryptBytes, decryptBytes } from '../utils/crypto';

export default function ChatPage() {
  const { id } = useParams();
  const dialogId = String(id);

  const [dialog, setDialog] = useState(null);
  const [messages, setMessages] = useState([]); // items with optional plaintext for text and renderUrl for images
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);

  const lastCreatedAtRef = useRef(null);
  const prevUrlsRef = useRef(new Set());

  const fileInputRef = useRef(null);

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

  const revokeUrlSafe = (url) => {
    try {
      if (url) URL.revokeObjectURL(url);
    } catch (_) {
      // ignore
    }
  };

  const decryptMessages = async (items, key, prevMessages = []) => {
    if (!Array.isArray(items)) return [];

    const prevMap = {};
    for (let i = 0; i < prevMessages.length; i += 1) {
      const pm = prevMessages[i];
      prevMap[pm.id] = pm;
    }

    if (!key) {
      return items.map((m) => ({
        ...m,
        plaintext: null,
        notDecrypted: true,
      }));
    }

    const out = [];
    for (let i = 0; i < items.length; i += 1) {
      const m = items[i];
      const type = m.content_type || 'text';
      try {
        if (type === 'image') {
          const bytes = await decryptBytes(m.ciphertext, key);
          const prev = prevMap[m.id];
          let renderUrl = prev && prev.renderUrl && prev.ciphertext === m.ciphertext ? prev.renderUrl : null;
          if (!renderUrl) {
            if (prev && prev.renderUrl && prev.ciphertext !== m.ciphertext) {
              revokeUrlSafe(prev.renderUrl);
            }
            const blob = new Blob([bytes], { type: m.media_mime || 'application/octet-stream' });
            renderUrl = URL.createObjectURL(blob);
          }
          out.push({ ...m, renderUrl, notDecrypted: false });
        } else {
          const pt = await decryptString(m.ciphertext, key);
          out.push({ ...m, plaintext: pt, notDecrypted: false });
        }
      } catch (_) {
        // cannot decrypt
        const prev = prevMap[m.id];
        // If ciphertext changed and we had an url, revoke it
        if (prev && prev.renderUrl && prev.ciphertext !== m.ciphertext) {
          revokeUrlSafe(prev.renderUrl);
        }
        out.push({ ...m, plaintext: null, renderUrl: undefined, notDecrypted: true });
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
      const processed = await decryptMessages(resp?.items || [], key, []);
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
      const base = messages.map((m) => ({
        id: m.id,
        dialog: m.dialog,
        sender: m.sender,
        ciphertext: m.ciphertext,
        created_at: m.created_at,
        content_type: m.content_type,
        media_mime: m.media_mime,
        media_name: m.media_name,
        media_size: m.media_size,
      }));
      const processed = await decryptMessages(base, cryptoKey, messages);
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
          const processed = await decryptMessages(items, cryptoKey, messages);
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
  }, [dialogId, cryptoKey, messages]);

  // Revoke ObjectURLs that are no longer present in state (memory management)
  useEffect(() => {
    const currentUrls = new Set();
    for (let i = 0; i < messages.length; i += 1) {
      const m = messages[i];
      const type = m.content_type || 'text';
      if (type === 'image' && m.renderUrl) currentUrls.add(m.renderUrl);
    }
    const prev = prevUrlsRef.current;
    prev.forEach((url) => {
      if (!currentUrls.has(url)) revokeUrlSafe(url);
    });
    prevUrlsRef.current = currentUrls;
    return () => {
      // nothing here; global cleanup in unmount effect below
    };
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      const prev = prevUrlsRef.current;
      prev.forEach((url) => revokeUrlSafe(url));
      prevUrlsRef.current = new Set();
    };
  }, []);

  const onSend = async () => {
    if (!text) return;
    setError('');
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
      const processed = await decryptMessages([created], key, messages);
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

  const onPickImage = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('read_failed'));
      reader.readAsArrayBuffer(file);
    });
  };

  const onFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    // Reset input so selecting the same file again triggers change
    if (e.target) {
      try { e.target.value = ''; } catch (_) { /* ignore */ }
    }
    if (!file) return;

    if (file.size > IMAGE_MAX_BYTES) {
      setError(`Файл слишком большой. Максимум ${(IMAGE_MAX_BYTES / (1024 * 1024)).toFixed(0)} МБ.`);
      return;
    }

    setError('');
    setSending(true);
    try {
      let key = cryptoKey;
      if (!key) {
        key = await loadPassphraseIfAny();
        if (!key) {
          setSending(false);
          return; // user must enter key first
        }
      }

      const buf = await readFileAsArrayBuffer(file);
      const bytes = new Uint8Array(buf);
      const ciphertext = await encryptBytes(bytes, key);

      const created = await sendMessage(dialogId, {
        content_type: 'image',
        ciphertext,
        media_mime: file.type || 'application/octet-stream',
        media_name: file.name || 'image',
        media_size: file.size,
      });

      const processed = await decryptMessages([created], key, messages);
      setMessages((prev) => [...prev, ...processed]);
      if (processed.length) {
        lastCreatedAtRef.current = processed[processed.length - 1].created_at;
      }
    } catch (e) {
      setError('Не удалось отправить изображение');
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
          {messages.map((m) => {
            const isOther = m.sender === dialog?.participant?.id;
            const type = m.content_type || 'text';
            return (
              <div data-easytag="id10-react/src/pages/ChatPage.jsx" key={m.id} className={`max-w-[80%] w-max px-3 py-2 rounded-lg ${isOther ? 'bg-white/5' : 'bg-brand/20 ml-auto'}`}>
                {type === 'image' ? (
                  m.renderUrl && !m.notDecrypted ? (
                    <div data-easytag="id24-react/src/pages/ChatPage.jsx" className="max-w-[60vw] md:max-w-[60%]">
                      <img
                        data-easytag="id25-react/src/pages/ChatPage.jsx"
                        src={m.renderUrl}
                        alt={m.media_name || 'image'}
                        className="rounded-lg max-h-[60vh] object-cover"
                      />
                    </div>
                  ) : (
                    <div data-easytag="id26-react/src/pages/ChatPage.jsx" className="text-sm break-words">Изображение не расшифровано (неверный ключ)</div>
                  )
                ) : (
                  <div data-easytag="id11-react/src/pages/ChatPage.jsx" className="text-sm break-words">{m.plaintext !== null && m.plaintext !== undefined ? m.plaintext : 'Сообщение не расшифровано (неверный ключ)'}</div>
                )}
                <div data-easytag="id12-react/src/pages/ChatPage.jsx" className="text-[10px] text-muted mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            );
          })}
        </div>

        <div data-easytag="id13-react/src/pages/ChatPage.jsx" className="p-3 border-t border-white/10 bg-card">
          <div data-easytag="id14-react/src/pages/ChatPage.jsx" className="flex items-center gap-2">
            <button data-easytag="id27-react/src/pages/ChatPage.jsx" onClick={onPickImage} disabled={sending} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 disabled:opacity-60">Фото</button>
            <input
              data-easytag="id28-react/src/pages/ChatPage.jsx"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelected}
            />
            <input data-easytag="id15-react/src/pages/ChatPage.jsx" value={text} onChange={(e) => setText(e.target.value)} placeholder="Введите сообщение" className="flex-1 bg-bg border border-white/10 rounded-md px-3 py-2 outline-none focus:border-brand" />
            <button data-easytag="id16-react/src/pages/ChatPage.jsx" onClick={onSend} disabled={sending || !text} className="px-4 py-2 rounded-md bg-brand hover:opacity-90 disabled:opacity-60">Отправить</button>
          </div>
          <div data-easytag="id29-react/src/pages/ChatPage.jsx" className="text-[11px] text-muted mt-1">Макс. размер фото: {(IMAGE_MAX_BYTES / (1024 * 1024)).toFixed(0)} МБ</div>
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
