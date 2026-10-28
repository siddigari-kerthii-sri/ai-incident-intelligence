
import supabase from './supabaseClient';

export async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const demoToken = sessionStorage.getItem('incident_demo_token');
  const token = demoToken || session?.access_token;

  if (!token) {
    throw new Error('Your session is missing. Please sign in again.');
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${path}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = 'The request failed. Please try again.';

    try {
      const body = await response.json();
      const detail = body.detail;

      message =
        typeof detail === 'string'
          ? detail
          : detail != null
            ? JSON.stringify(detail)
            : message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;

  return response.json();
}
