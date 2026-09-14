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
    const refreshTokenVal = localStorage.getItem('refresh_token');
    if (!refreshTokenVal) {
      throw new ApiError('No refresh token available', 401);
    }
    refreshPromise = fetch(`${BASE_URL}auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenVal }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new ApiError('Refresh failed', res.status);
        }
        const data = await res.json();
        if (data.data?.access_token) {
          localStorage.setItem('access_token', data.data.access_token);
        }
        if (data.data?.refresh_token) {
          localStorage.setItem('refresh_token', data.data.refresh_token);
        }
        return data;
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

  const accessToken = localStorage.getItem('access_token');
  const authHeaders = accessToken ? { 'Authorization': `bearer ${accessToken}`, ...headers } : { ...headers };

  const optionsHeaders = isFormData
    ? authHeaders
    : { 'Content-Type': 'application/json', ...authHeaders };

  const options = {
    method,
    headers: optionsHeaders,
  };

  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  let res = await fetch(url, options);

  // Only try to recover a session that existed. A guest has no token to
  // refresh, so this used to fall straight into the catch and tell them
  // "Session expired. Please login again." — about a session they never had,
  // on a page that simply needed an account. Now their 401 falls through to
  // the normal error path and the caller can ask them to sign in.
  if (res.status === 401 && auth && accessToken) {
    try {
      await refreshAccessToken();
      const newAccessToken = localStorage.getItem('access_token');
      if (newAccessToken) {
        options.headers['Authorization'] = `bearer ${newAccessToken}`;
      }
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
