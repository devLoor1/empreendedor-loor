import { onlyDigits } from "@/utils/br-formatters";

const BRASIL_API_TIMEOUT_MS = 7000;

type BrasilApiCepResponse = {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
};

type BrasilApiCnpjResponse = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  ddd_telefone_1?: string;
  email?: string;
};

async function fetchBrasilApiJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), BRASIL_API_TIMEOUT_MS);
  const abortFromExternalSignal = () => controller.abort();

  if (signal?.aborted) {
    window.clearTimeout(timeoutId);
    return null;
  }

  signal?.addEventListener("abort", abortFromExternalSignal, { once: true });

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromExternalSignal);
  }
}

export async function lookupCep(cep: string, signal?: AbortSignal) {
  const digits = onlyDigits(cep);

  if (digits.length !== 8) return null;

  return fetchBrasilApiJson<BrasilApiCepResponse>(
    `https://brasilapi.com.br/api/cep/v2/${digits}`,
    signal,
  );
}

export async function lookupCnpjInfo(cnpj: string, signal?: AbortSignal) {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14) return null;

  return fetchBrasilApiJson<BrasilApiCnpjResponse>(
    `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
    signal,
  );
}
