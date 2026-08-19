const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '') + '/';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new ApiError('Refresh failed', res.status);
        }
        return await res.json();
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const request = async (path, { method = 'GET', body, headers = {}, auth = false } = {}) => {
  const url = `${BASE_URL}${path.replace(/^\/+/, '')}`;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const optionsHeaders = isFormData
    ? { ...headers }
    : { 'Content-Type': 'application/json', ...headers };

  const options = {
    method,
    headers: optionsHeaders,
    credentials: 'include',
  };

  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  let res = await fetch(url, options);

  if (res.status === 401 && auth) {
    try {
      await refreshAccessToken();
      res = await fetch(url, options);
    } catch {
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
};

export { ApiError };
