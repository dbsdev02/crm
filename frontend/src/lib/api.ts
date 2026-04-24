// In the APK there is no Vite proxy, so we need the real backend URL.
// Set VITE_API_URL in .env for web dev (leave empty = use proxy).
// For the APK build set it in frontend/.env: VITE_API_URL=http://<your-server-ip>:5000
const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

function getToken() {
  return localStorage.getItem("crm_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
