import instance from './axios';

export async function listDialogs() {
  const res = await instance.get('/api/dialogs/');
  return res.data;
}

export async function getOrCreateDialog(user_id) {
  const res = await instance.post('/api/dialogs/', { user_id });
  return res.data;
}

export async function getDialog(id) {
  const res = await instance.get(`/api/dialogs/${id}/`);
  return res.data;
}
