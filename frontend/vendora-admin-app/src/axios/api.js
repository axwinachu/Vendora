import axios from 'axios';
import keycloak from '../keycloak/keycloak';

const API = axios.create({
  baseURL: 'http://localhost:8888',
});

// ── Request interceptor — attach a fresh token before every call ──────────────
// Always try to refresh if the token expires within the next 30 seconds.
// This prevents 401s mid-session without forcing a full re-login.
API.interceptors.request.use(
  async (config) => {
    try {
      // updateToken(30): refresh if token expires in < 30 seconds
      await keycloak.updateToken(30);
    } catch {
      // Refresh failed (e.g. refresh token also expired) → force re-login
      keycloak.login();
      return Promise.reject(new Error('Session expired. Redirecting to login.'));
    }

    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — surface backend error messages cleanly ─────────────
// The backend's GlobalExceptionHandler returns: { status, error, message, timeStamp }
// We extract .message so callers get a readable string, not the raw axios error.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage = error.response?.data?.message;
    const status         = error.response?.status;

    if (status === 401) {
      keycloak.login();
      return Promise.reject(new Error('Session expired. Redirecting to login.'));
    }

    // Use the backend's message if available, otherwise fall back to axios default
    const message = backendMessage || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default API;