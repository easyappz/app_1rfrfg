import instance from './axios';

export async function listMessages(dialogId, params = {}) {
  const res = await instance.get(`/api/dialogs/${dialogId}/messages`, { params });
  return res.data;
}

export async function sendMessage(dialogId, payload) {
  const res = await instance.post(`/api/dialogs/${dialogId}/messages`, payload);
  return res.data;
}
