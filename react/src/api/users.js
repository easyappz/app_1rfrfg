import instance from './axios';

export async function me() {
  const res = await instance.get('/api/users/me');
  return res.data;
}

export async function updateMe(payload) {
  const res = await instance.patch('/api/users/me', payload);
  return res.data;
}

export async function searchUsers(phone) {
  const res = await instance.get('/api/users/search', { params: { phone } });
  return res.data;
}
