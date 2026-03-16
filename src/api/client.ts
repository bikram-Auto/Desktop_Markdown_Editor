const API_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_URL}${path}`;
  const token = localStorage.getItem('token');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};
