const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '') + '/';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * What to put in front of a customer when a request fails.
 *
 * A server in trouble very often answers with a proxy's HTML error page
 * rather than with JSON, and `message` then holds an entire document. One of
 * those was rendered inside the red box on the pay screen — a customer at the
 * last step of a purchase reading "503 Service Temporarily Unavailable" in
 * raw markup. Anything that is not a short, plain sentence is kept for the
 * console and replaced here.
 *
 * `code` travels with the error so a screen can say it in the reader's own
 * language; the text is the fallback for the ones that have not been taught
 * to.
 */
const humanError = (data, status) => {
  const raw = typeof data?.message === 'string' ? data.message.trim() : '';
  const usable = raw && raw.length <= 200 && !/^<|<\/?[a-z]+[\s>]/i.test(raw);

  if (usable) return { message: raw, code: null };

  if (raw) {
    console.error(`[api] ${status} carried no usable message:`, raw.slice(0, 300));
  }

  if (status >= 500 || status === 0) {
    return {
      message: 'The server is busy. Please try again in a moment.',
      code: 'server_busy',
    };
  }

  return { message: 'Something went wrong. Please try again.', code: 'unknown' };
};

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
    const { message, code } = humanError(data, res.status);
    const error = new ApiError(message, res.status, data);
    error.code = code;
    throw error;
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
