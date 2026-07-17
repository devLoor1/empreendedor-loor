const API_BASE = import.meta.env.VITE_API_BASE_URL || (window.location.protocol === 'https:' ? 'https://back.loor.vc/service' : 'http://127.0.0.1:3333');

const TOKEN_KEY = 'entrepreneur_token';
const DEFAULT_API_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';

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

async function parseResponseBody(res: Response) {
  if (res.status === 204 || res.status === 205 || res.headers.get('content-length') === '0') {
    return null;
  }

  const text = await res.text();

  if (!text.trim()) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildApiError(status: number, body: unknown) {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return { status, ...body };
  }

  if (typeof body === 'string' && body.trim()) {
    return { status, message: body };
  }

  return { status, message: DEFAULT_API_ERROR_MESSAGE };
}

async function handleApiResponse(res: Response) {
  const body = await parseResponseBody(res);

  if (!res.ok) {
    throw buildApiError(res.status, body);
  }

  return body;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const slug = import.meta.env.VITE_API_SLUG;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (slug) {
    headers['x-whitelabel-slug'] = slug;
  }

  // Adiciona platform_slug como campo extra no corpo da requisição se existir body e for JSON
  let body = options.body;
  if (slug && body && typeof body === 'string' && headers['Content-Type']?.includes('application/json')) {
    try {
      const parsedBody = JSON.parse(body);
      parsedBody.platform_slug = slug;
      body = JSON.stringify(parsedBody);
    } catch (e) {
      // Se não conseguir parsear, mantém o body original
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
  });

  return handleApiResponse(res);
}

async function apiFormData(path: string, method: 'POST' | 'PUT', formData: FormData) {
  const token = getToken();
  const slug = import.meta.env.VITE_API_SLUG;

  if (slug && !formData.has('platform_slug')) {
    formData.append('platform_slug', slug);
  }

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (slug) {
    headers['x-whitelabel-slug'] = slug;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
  });

  return handleApiResponse(res);
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

export async function confirmRegister(token: string) {
  return apiFetch('/confirm-register', {
    method: 'PUT',
    body: JSON.stringify({ token }),
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

export async function updatePersonalInformation(data: Record<string, unknown>) {
  return apiFetch('/entrepreneurs/profile/personal-information', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateAvatar(formData: FormData) {
  return apiFormData('/entrepreneurs/profile/avatar', 'PUT', formData);
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

export async function saveAddress(data: Record<string, unknown>) {
  return apiFetch('/entrepreneurs/address', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Banking ───────────────────────────────────────────────────────────────────

export async function getBankingInformation() {
  return apiFetch('/entrepreneurs/banking-information');
}

export async function saveBankingInformation(data: Record<string, unknown>) {
  return apiFetch('/entrepreneurs/banking-information', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBanks() {
  return apiFetch('/entrepreneurs/banks');
}

export async function getSegments() {
  return apiFetch('/segments');
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

export async function createOpportunity(data: Record<string, unknown>) {
  return apiFetch('/entrepreneurs/opportunities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOpportunity(id: number, data: Record<string, unknown>) {
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

export async function debtSimulatePayment(txid: string) {
  return apiFetch(`/dev/debt/pay-by-txid`, {
    method: 'POST',
    body: JSON.stringify({ txid }),
  });
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getOpportunityDocuments(id: number) {
  return apiFetch(`/entrepreneurs/opportunities/${id}/documents`);
}

export async function getEntrepreneurDocuments() {
  return apiFetch('/entrepreneurs/documents');
}

export async function uploadEntrepreneurDocument(formData: FormData) {
  return apiFormData('/entrepreneurs/documents', 'POST', formData);
}

export async function replaceEntrepreneurDocument(documentId: number, formData: FormData) {
  return apiFormData(`/entrepreneurs/documents/${documentId}`, 'PUT', formData);
}

// ── Images ────────────────────────────────────────────────────────────────────

export async function uploadImage(formData: FormData) {
  return apiFormData('/entrepreneurs/images', 'POST', formData);
}

// ── Home ──────────────────────────────────────────────────────────────────────

export async function getHome() {
  return apiFetch('/entrepreneurs/home');
}

// ── Warranties ────────────────────────────────────────────────────────────────

export async function getWarranties() {
  return apiFetch('/entrepreneurs/warranties');
}

// ── Tools / Access ───────────────────────────────────────────────────────────

export const ENTREPRENEUR_TOOL_KEYS = [
  'kanban',
  'pitch_deck',
  'metrics',
  'goals',
  'agenda',
] as const;

export type EntrepreneurToolKey = (typeof ENTREPRENEUR_TOOL_KEYS)[number];

export type EntrepreneurTool = {
  key: string;
  label: string;
  enabled: boolean;
};

export async function getEntrepreneurTools() {
  return apiFetch('/entrepreneurs/tools') as Promise<{ data: EntrepreneurTool[] }>;
}

// ── Tools / Tasks ────────────────────────────────────────────────────────────

export type EntrepreneurTaskColumn = 'backlog' | 'todo' | 'review' | 'done';

export type EntrepreneurTask = {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  column: EntrepreneurTaskColumn;
  position: number;
  created_at: string;
  updated_at: string;
};

export type EntrepreneurTaskInput = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  column?: EntrepreneurTaskColumn;
  position?: number;
};

export async function getEntrepreneurTasks() {
  return apiFetch('/entrepreneurs/tasks') as Promise<{ data: EntrepreneurTask[] }>;
}

export async function createEntrepreneurTask(data: EntrepreneurTaskInput) {
  return apiFetch('/entrepreneurs/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }) as Promise<{ data: { id: number } }>;
}

export async function updateEntrepreneurTask(id: number, data: Partial<EntrepreneurTaskInput>) {
  return apiFetch(`/entrepreneurs/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEntrepreneurTask(id: number) {
  return apiFetch(`/entrepreneurs/tasks/${id}`, {
    method: 'DELETE',
  });
}

// ── Tools / Pitch Decks ──────────────────────────────────────────────────────

export type EntrepreneurPitchDeck = {
  id: number;
  description: string | null;
  problem: string | null;
  solution: string | null;
  market: string | null;
  product: string | null;
  business_model: string | null;
  traction: string | null;
  team: string | null;
  financial: string | null;
  fundraising: string | null;
  generated_content: string | null;
  download_link: string | null;
  pdf_download_link: string | null;
  created_at: string;
  updated_at: string;
};

export type EntrepreneurPitchDeckInput = {
  description?: string | null;
  problem?: string | null;
  solution?: string | null;
  market?: string | null;
  product?: string | null;
  business_model?: string | null;
  traction?: string | null;
  team?: string | null;
  financial?: string | null;
  fundraising?: string | null;
  generated_content?: string | null;
};

export async function getEntrepreneurPitchDecks() {
  return apiFetch('/entrepreneurs/pitch-decks') as Promise<{ data: EntrepreneurPitchDeck[] }>;
}

export async function createEntrepreneurPitchDeck(data: EntrepreneurPitchDeckInput) {
  return apiFetch('/entrepreneurs/pitch-decks', {
    method: 'POST',
    body: JSON.stringify(data),
  }) as Promise<{ data: { id: number } }>;
}

export async function updateEntrepreneurPitchDeck(id: number, data: EntrepreneurPitchDeckInput) {
  return apiFetch(`/entrepreneurs/pitch-decks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEntrepreneurPitchDeck(id: number) {
  return apiFetch(`/entrepreneurs/pitch-decks/${id}`, {
    method: 'DELETE',
  });
}

export async function generateEntrepreneurPitchDeck(id: number, prompt?: string) {
  return apiFetch(`/entrepreneurs/pitch-decks/${id}/generate`, {
    method: 'POST',
    body: JSON.stringify({ prompt: prompt || undefined }),
  }) as Promise<{
    data: {
      text: string;
      file_id: number;
      provider: string;
      model: string;
    };
  }>;
}

export async function generateEntrepreneurPitchDeckPdf(id: number) {
  return apiFetch(`/entrepreneurs/pitch-decks/${id}/pdf`, {
    method: 'POST',
  }) as Promise<{ data: { file_id: number } }>;
}
