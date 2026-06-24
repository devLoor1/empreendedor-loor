import { useEffect, useState } from "react";

export type PersonalProfile = {
  full_name: string;
  phone: string;
  gender: string;
  cpf: string;
  rg: string;
  issuing_entity: string;
  marital_status: string;
  birth_date: string;
};

export type CompanyProfile = {
  cnpj: string;
  business_name: string;
  trade_name: string;
  opening_date: string;
  legal_nature: string;
  share_capital: string;
  main_activity: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    zip_code: string;
  };
};

export type DocStatus = "missing" | "uploaded" | "approved";
export type DocItem = {
  id: string;
  name: string;
  description: string;
  category: "empresa" | "pessoal" | "financeiro" | "juridico";
  required: boolean;
  status: DocStatus;
  file_name?: string;
  uploaded_at?: string;
};

export type Campaign = {
  id: string;
  name: string;
  modality: "equity" | "debt";
  goal: number;
  raised: number;
  investors: number;
  status: "review" | "active" | "finished" | "archived";
  due_at: string;
  segment: string;
};

export type AppUser = { email: string; full_name: string; phone: string };

const KEYS = {
  user: "loor.user",
  personal: "loor.personal",
  company: "loor.company",
  docs: "loor.docs",
  campaigns: "loor.campaigns",
};

const DEFAULT_DOCS: DocItem[] = [
  { id: "contrato-social", name: "Contrato Social", description: "Última versão consolidada do contrato/estatuto social.", category: "empresa", required: true, status: "missing" },
  { id: "cartao-cnpj", name: "Cartão CNPJ", description: "Comprovante de inscrição no CNPJ atualizado.", category: "empresa", required: true, status: "missing" },
  { id: "balanco", name: "Balanço Patrimonial", description: "Balanço dos últimos 2 exercícios (CVM 88 art. 8º).", category: "financeiro", required: true, status: "missing" },
  { id: "dre", name: "DRE", description: "Demonstração de Resultados dos últimos 2 exercícios.", category: "financeiro", required: true, status: "missing" },
  { id: "plano-negocios", name: "Plano de Negócios", description: "Descrição do negócio, mercado e projeções.", category: "empresa", required: true, status: "missing" },
  { id: "valuation", name: "Memória de Cálculo do Valuation", description: "Como o valor da empresa foi calculado.", category: "financeiro", required: true, status: "missing" },
  { id: "rg-cpf", name: "RG e CPF dos Sócios", description: "Documento de identidade de cada sócio.", category: "pessoal", required: true, status: "missing" },
  { id: "comprovante-endereco", name: "Comprovante de Endereço", description: "Comprovante atualizado (até 90 dias) dos sócios.", category: "pessoal", required: true, status: "missing" },
  { id: "certidoes", name: "Certidões Negativas", description: "Certidões federais, estaduais e trabalhistas da empresa.", category: "juridico", required: true, status: "missing" },
  { id: "ata-aprovacao", name: "Ata de Aprovação da Oferta", description: "Ato societário aprovando a captação.", category: "juridico", required: true, status: "missing" },
  { id: "termo-adesao", name: "Termo de Adesão Modelo", description: "Modelo do contrato com investidores.", category: "juridico", required: true, status: "missing" },
  { id: "pitch-deck", name: "Pitch Deck", description: "Apresentação executiva (opcional, mas recomendado).", category: "empresa", required: false, status: "missing" },
];

const DEFAULT_CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "AgroTech Solar", modality: "equity", goal: 1500000, raised: 980000, investors: 142, status: "active", due_at: "2026-08-15", segment: "Agronegócio" },
  { id: "c2", name: "MedFlow Saúde", modality: "debt", goal: 800000, raised: 620000, investors: 89, status: "active", due_at: "2026-07-30", segment: "Saúde" },
  { id: "c3", name: "EduPlay Kids", modality: "equity", goal: 500000, raised: 175000, investors: 34, status: "active", due_at: "2026-09-10", segment: "Educação" },
  { id: "c4", name: "FinPay Express", modality: "debt", goal: 2000000, raised: 2000000, investors: 310, status: "finished", due_at: "2026-05-01", segment: "Fintech" },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("loor:storage", { detail: { key } }));
}

export const mockStore = {
  getUser: () => read<AppUser | null>(KEYS.user, null),
  setUser: (u: AppUser | null) => write(KEYS.user, u),
  signOut: () => write<AppUser | null>(KEYS.user, null),

  getPersonal: () => read<PersonalProfile | null>(KEYS.personal, null),
  setPersonal: (p: PersonalProfile) => write(KEYS.personal, p),

  getCompany: () => read<CompanyProfile | null>(KEYS.company, null),
  setCompany: (c: CompanyProfile) => write(KEYS.company, c),

  getDocs: () => read<DocItem[]>(KEYS.docs, DEFAULT_DOCS),
  setDocs: (d: DocItem[]) => write(KEYS.docs, d),

  getCampaigns: () => read<Campaign[]>(KEYS.campaigns, DEFAULT_CAMPAIGNS),
};

export function useMock<T>(getter: () => T): T {
  const [val, setVal] = useState<T>(getter);
  useEffect(() => {
    const refresh = () => setVal(getter());
    window.addEventListener("loor:storage", refresh);
    window.addEventListener("storage", refresh);
    refresh();
    return () => {
      window.removeEventListener("loor:storage", refresh);
      window.removeEventListener("storage", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return val;
}

// Mock CNPJ lookup (simulates ReceitaWS / BrasilAPI)
export async function lookupCnpj(cnpj: string): Promise<CompanyProfile> {
  const clean = cnpj.replace(/\D/g, "");
  await new Promise((r) => setTimeout(r, 900));
  if (clean.length !== 14) throw new Error("CNPJ inválido");
  return {
    cnpj: clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"),
    business_name: "Startup Exemplo Tecnologia LTDA",
    trade_name: "Startup Exemplo",
    opening_date: "2021-03-14",
    legal_nature: "206-2 - Sociedade Empresária Limitada",
    share_capital: "100000.00",
    main_activity: "62.01-5-01 - Desenvolvimento de programas de computador sob encomenda",
    email: "contato@startupexemplo.com.br",
    phone: "(11) 4002-8922",
    address: {
      street: "Avenida Paulista",
      number: "1578",
      complement: "Conj. 1201",
      district: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zip_code: "01310-200",
    },
  };
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function formatBRLFromReais(reais: number) {
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}