export default async function handler(req, res) {
  const rawPath = req.query.path;
  const pathSegments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const pathStr = pathSegments.join('/');

  let backendUrl = `https://rock-diet-backend.vercel.app/${pathStr}`;
  const raw = req.url || '';
  const qIdx = raw.indexOf('?');
  if (qIdx !== -1) {
    backendUrl += raw.slice(qIdx);
  }

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;

  const fetchOptions = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    if (chunks.length > 0) {
      fetchOptions.body = Buffer.concat(chunks);
    }
  }

  try {
    const response = await fetch(backendUrl, fetchOptions);

    for (const [key, value] of response.headers) {
      const k = key.toLowerCase();
      if (k !== 'transfer-encoding' && k !== 'content-encoding') {
        res.appendHeader(key, value);
      }
    }

    res.status(response.status);
    const body = await response.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(502).json({ message: 'Backend unreachable' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
