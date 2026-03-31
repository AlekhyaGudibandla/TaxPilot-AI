const API_BASE = '/api';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Health
  health: () => request('/health'),

  // Dashboard & Returns
  getDashboard: () => request('/dashboard'),

  // Calculators
  getClients: () => request('/clients'),
  createClient: (data: any) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request(`/clients/${id}`, { method: 'DELETE' }),

  // Upload
  uploadFiles: async (files: File[], clientId?: string) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    const url = clientId ? `${API_BASE}/upload?client_id=${clientId}` : `${API_BASE}/upload`;
    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  getUploads: (clientId?: string) => request(`/upload${clientId ? `?client_id=${clientId}` : ''}`),

  // Workflows
  startWorkflow: (data: any) => request('/ai/workflow', { method: 'POST', body: JSON.stringify(data) }),
  getWorkflows: (clientId?: string) => request(`/ai/workflow${clientId ? `?client_id=${clientId}` : ''}`),

  // Returns
  getGSTReturns: (clientId?: string) => request(`/returns/gst${clientId ? `?client_id=${clientId}` : ''}`),
  getITRReturns: (clientId?: string) => request(`/returns/itr${clientId ? `?client_id=${clientId}` : ''}`),
  getTDSReturns: (clientId?: string) => request(`/returns/tds${clientId ? `?client_id=${clientId}` : ''}`),

  // Audit
  getAuditLogs: (clientId?: string) => request(`/audit-logs${clientId ? `?client_id=${clientId}` : ''}`),

  // Analytics
  getAnalytics: (clientId?: string) => request(`/analytics${clientId ? `?client_id=${clientId}` : ''}`),

  // Employees
  getEmployees: (clientId: string) => request(`/employees?client_id=${clientId}`),
  createEmployee: (clientId: string, data: any) => request(`/employees?client_id=${clientId}`, { method: 'POST', body: JSON.stringify(data) }),

  // Copilot
  askCopilot: (query: string, clientId?: string) => request('/ai/copilot', { method: 'POST', body: JSON.stringify({ query, client_id: clientId }) }),

  // Tax Calculator
  calcTax: (income: number, regime: string) => request(`/tax-calculator?income=${income}&regime=${regime}`),
};
