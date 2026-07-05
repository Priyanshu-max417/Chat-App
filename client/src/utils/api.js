import { API_BASE, buildApiUrl } from '../config/api';

const getToken = () => localStorage.getItem('token');

export const api = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const res = await fetch(buildApiUrl('/upload'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Upload failed');
  }
  return data;
};
