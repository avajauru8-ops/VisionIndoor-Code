let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

async function refreshToken(): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  headers['Accept'] = 'application/json';

  let response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const error = await response.clone().json().catch(() => ({}));
    const msg = error.error || '';

    if (msg.includes('expirado') || msg.includes('Token inv')) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshToken();
        isRefreshing = false;

        if (newToken) {
          onRefreshed(newToken);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }

      const newToken = await new Promise<string>((resolve) => {
        refreshSubscribers.push(resolve);
      });

      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(endpoint, { ...options, headers });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || error.title || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
