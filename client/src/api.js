export class ApiError extends Error {
  constructor(status, code, fields = []) {
    super(code);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// Calls the API with JSON; the session cookie is sent automatically (same origin)
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'SERVER_ERROR', data.fields);
  return data;
}
