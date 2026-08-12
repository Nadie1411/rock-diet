const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.BACK_END || 'http://localhost:3000/';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const getToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const setTokens = ({ access_token, refresh_token }) => {
  if (access_token) localStorage.setItem('access_token', access_token);
  if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    clearTokens();
    throw new ApiError('No refresh token available', 401);
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          clearTokens();
          throw new ApiError(data.message || 'Failed to refresh token', res.status, data);
        }
        setTokens(data.data);
        return data.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const request = async (path, { method = 'GET', body, headers = {}, auth = false } = {}) => {
  const url = `${BASE_URL}${path.replace(/^\//, '')}`;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const optionsHeaders = isFormData
    ? { ...headers }
    : { 'Content-Type': 'application/json', ...headers };

  const options = {
    method,
    headers: optionsHeaders,
  };

  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) {
      options.headers.Authorization = `bearer ${token}`;
    }
  }

  let res = await fetch(url, options);

  // If 401 and auth required, try to refresh token once
  if (res.status === 401 && auth) {
    try {
      await refreshAccessToken();
      const newToken = getToken();
      options.headers.Authorization = `bearer ${newToken}`;
      res = await fetch(url, options);
    } catch {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      throw new ApiError('Session expired. Please login again.', 401);
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || 'Request failed';
    throw new ApiError(errorMsg, res.status, data);
  }

  return data;
};

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  setTokens,
  clearTokens,
  getToken,
  getRefreshToken,
};

export { ApiError };