const API_BASE = import.meta.env.VITE_API_BASE_URL || (window.location.protocol === 'https:' ? 'https://back.loor.vc/service' : 'http://127.0.0.1:3333');

const TOKEN_KEY = 'entrepreneur_token';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { status: res.status, ...body };
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  return apiFetch('/auth/entrepreneur/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: { email: string; password: string; full_name: string; phone: string }) {
  return apiFetch('/auth/entrepreneur/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function recoverPassword(email: string) {
  return apiFetch('/auth/entrepreneur/recover', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function changePassword(token: string, password: string, password_confirmation: string) {
  return apiFetch('/auth/entrepreneur/change-password', {
    method: 'POST',
    body: JSON.stringify({ token, password, password_confirmation }),
  });
}

export async function getMe() {
  return apiFetch('/auth/entrepreneur/me');
}

export async function logout() {
  return apiFetch('/auth/entrepreneur/logout', { method: 'POST' });
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getPersonalInformation() {
  return apiFetch('/entrepreneurs/personal-information');
}

export async function updatePersonalInformation(data: Record<string, any>) {
  return apiFetch('/entrepreneurs/profile/personal-information', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateAvatar(formData: FormData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/entrepreneurs/profile/avatar`, {
    method: 'PUT',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) throw await res.json().catch(() => ({}));
  return res.status === 204 ? null : res.json();
}

export async function changeUserPassword(old_password: string, password: string, password_confirmation: string) {
  return apiFetch('/entrepreneurs/profile/change-password', {
    method: 'PUT',
    body: JSON.stringify({ old_password, password, password_confirmation }),
  });
}

// ── Address ───────────────────────────────────────────────────────────────────

export async function getAddress() {
  return apiFetch('/entrepreneurs/address');
}

export async function saveAddress(data: Record<string, any>) {
  return apiFetch('/entrepreneurs/address', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Banking ───────────────────────────────────────────────────────────────────

export async function getBankingInformation() {
  return apiFetch('/entrepreneurs/banking-information');
}

export async function saveBankingInformation(data: Record<string, any>) {
  return apiFetch('/entrepreneurs/banking-information', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBanks() {
  return apiFetch('/entrepreneurs/banks');
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export async function getActiveOpportunities(page = 1, limit = 15) {
  return apiFetch(`/entrepreneurs/opportunities/active?page=${page}&limit=${limit}`);
}

export async function getReviewOpportunities(page = 1, limit = 15) {
  return apiFetch(`/entrepreneurs/opportunities/review?page=${page}&limit=${limit}`);
}

export async function getArchivedOpportunities(page = 1, limit = 15) {
  return apiFetch(`/entrepreneurs/opportunities/archive?page=${page}&limit=${limit}`);
}

export async function getFinishedOpportunities(page = 1, limit = 15) {
  return apiFetch(`/entrepreneurs/opportunities/finish?page=${page}&limit=${limit}`);
}

export async function getOpportunity(id: number) {
  return apiFetch(`/entrepreneurs/opportunities/${id}`);
}

export async function createOpportunity(data: Record<string, any>) {
  return apiFetch('/entrepreneurs/opportunities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOpportunity(id: number, data: Record<string, any>) {
  return apiFetch(`/entrepreneurs/opportunities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function archiveOpportunity(id: number) {
  return apiFetch(`/entrepreneurs/opportunities/${id}/archive`, {
    method: 'PUT',
  });
}

export async function getOpportunityInvestors(id: number, page = 1, limit = 15) {
  return apiFetch(`/entrepreneurs/opportunities/${id}/investors?page=${page}&limit=${limit}`);
}

// ── Debt ──────────────────────────────────────────────────────────────────────

export async function getDebt(opportunityId: number) {
  return apiFetch(`/entrepreneurs/opportunities/${opportunityId}/debt`);
}

export async function getDebtSummary(opportunityId: number) {
  return apiFetch(`/entrepreneurs/opportunities/${opportunityId}/debt/summary`);
}

export async function payNextInstallment(opportunityId: number) {
  return apiFetch(`/entrepreneurs/opportunities/${opportunityId}/debt/pay-installment`, {
    method: 'POST',
  });
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getOpportunityDocuments(id: number) {
  return apiFetch(`/entrepreneurs/opportunities/${id}/documents`);
}

// ── Images ────────────────────────────────────────────────────────────────────

export async function uploadImage(formData: FormData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/entrepreneurs/images`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) throw await res.json().catch(() => ({}));
  return res.json();
}

// ── Home ──────────────────────────────────────────────────────────────────────

export async function getHome() {
  return apiFetch('/entrepreneurs/home');
}

// ── Warranties ────────────────────────────────────────────────────────────────

export async function getWarranties() {
  return apiFetch('/entrepreneurs/warranties');
}
