import instance from './axios';

// Max allowed image size for client-side sending (10 MB)
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export async function listMessages(dialogId, params = {}) {
  const res = await instance.get(`/api/dialogs/${dialogId}/messages`, { params });
  return res.data;
}

/**
 * Send message payload. For image messages pass payload like:
 * {
 *   content_type: 'image',
 *   ciphertext: string, // encrypted bytes (base64-wrapped JSON from encryptBytes)
 *   media_mime: string,
 *   media_name: string,
 *   media_size: number,
 * }
 * For text messages, omit content_type or set 'text' and pass { ciphertext } from encryptString.
 */
export async function sendMessage(dialogId, payload) {
  const res = await instance.post(`/api/dialogs/${dialogId}/messages`, payload);
  return res.data;
}
