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

export type CampaignInvestor = {
  id: string;
  name: string;
  email: string;
  cpf_masked: string;
  invested_amount: number;
  quotas: number;
  status: "reserved" | "paid";
  invested_at: string;
};

export type Installment = {
  id: string;
  number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: "pending" | "paid" | "overdue";
};

export type CampaignMember = {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
};

export type EquityDetails = {
  type: "equity";
  participation: number; // % da empresa ofertada
};

export type DebtDetails = {
  type: "debt";
  percentage_profitability: number; // taxa % a.a.
  payment_frequency: "monthly" | "quarterly" | "semiannual" | "annual" | "at_maturity";
  grace_period: number; // meses
  total_installments: number;
  single_installment: boolean;
  installments: Installment[];
};

export type Campaign = {
  id: string;
  name: string;
  modality: "equity" | "debt";
  goal: number;
  min_goal: number;
  raised: number;
  investors: number;
  quota_value: number;
  total_quotas: number;
  available_quotas: number;
  status: "review" | "active" | "finished" | "archived";
  due_at: string;
  opened_at: string | null;
  segment: string;
  description: string;
  about: string;
  business_name: string;
  company_cnpj: string;
  whatsapp_group: string;
  promotional_video_url: string | null;
  image_url: string | null;
  warranty_amount: number;
  loor_fee_percent: number;
  fundraising_completion: "flexible" | "all_or_nothing";
  resource_utilization: string;
  is_private: boolean;
  members: CampaignMember[];
  investor_list: CampaignInvestor[];
  equity?: EquityDetails;
  debt?: DebtDetails;
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
  {
    id: "c1",
    name: "AgroTech Solar",
    modality: "equity",
    goal: 1500000,
    min_goal: 990000,
    raised: 980000,
    investors: 142,
    quota_value: 5000,
    total_quotas: 300,
    available_quotas: 104,
    status: "active",
    due_at: "2026-08-15",
    opened_at: "2026-04-01",
    segment: "Agronegócio",
    description: "A AgroTech Solar combina painéis solares inteligentes com irrigação automatizada, reduzindo custos de energia em até 70% para produtores rurais de médio porte.",
    about: "Fundada em 2023 por engenheiros agrônomos e especialistas em energia renovável, a AgroTech Solar já atende 45 fazendas no interior de São Paulo e Minas Gerais. A captação será utilizada para expandir operações para o Centro-Oeste e desenvolver a segunda geração do sistema de monitoramento IoT.",
    business_name: "AgroTech Solar Energia Ltda",
    company_cnpj: "45.123.456/0001-78",
    whatsapp_group: "https://chat.whatsapp.com/agrotech-investidores",
    promotional_video_url: "https://www.youtube.com/watch?v=example1",
    image_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    warranty_amount: 150000,
    loor_fee_percent: 5,
    fundraising_completion: "flexible",
    resource_utilization: "Expansão territorial, P&D segunda geração, contratação de equipe comercial",
    is_private: false,
    members: [
      { id: "m1", name: "Carlos Mendes", role: "CEO & Co-founder", avatar_url: "https://i.pravatar.cc/150?u=carlos" },
      { id: "m2", name: "Ana Souza", role: "CTO", avatar_url: "https://i.pravatar.cc/150?u=ana" },
      { id: "m3", name: "Ricardo Lima", role: "Diretor Comercial", avatar_url: "https://i.pravatar.cc/150?u=ricardo" },
    ],
    investor_list: [
      { id: "inv1", name: "João Silva", email: "joao@email.com", cpf_masked: "***.***.***-12", invested_amount: 25000, quotas: 5, status: "paid", invested_at: "2026-04-05" },
      { id: "inv2", name: "Maria Santos", email: "maria@email.com", cpf_masked: "***.***.***-34", invested_amount: 50000, quotas: 10, status: "paid", invested_at: "2026-04-08" },
      { id: "inv3", name: "Pedro Oliveira", email: "pedro@email.com", cpf_masked: "***.***.***-56", invested_amount: 15000, quotas: 3, status: "paid", invested_at: "2026-04-12" },
      { id: "inv4", name: "Fernanda Costa", email: "fernanda@email.com", cpf_masked: "***.***.***-78", invested_amount: 100000, quotas: 20, status: "paid", invested_at: "2026-04-15" },
      { id: "inv5", name: "Lucas Ferreira", email: "lucas@email.com", cpf_masked: "***.***.***-90", invested_amount: 10000, quotas: 2, status: "reserved", invested_at: "2026-06-20" },
    ],
    equity: { type: "equity", participation: 12.5 },
  },
  {
    id: "c2",
    name: "MedFlow Saúde",
    modality: "debt",
    goal: 800000,
    min_goal: 528000,
    raised: 620000,
    investors: 89,
    quota_value: 2000,
    total_quotas: 400,
    available_quotas: 90,
    status: "active",
    due_at: "2026-07-30",
    opened_at: "2026-03-15",
    segment: "Saúde",
    description: "Plataforma SaaS para gestão de clínicas e consultórios médicos com prontuário eletrônico, agendamento inteligente e telemedicina integrada.",
    about: "A MedFlow atende mais de 200 clínicas em 12 estados. Com a captação via dívida conversível, planeja integrar IA para triagem e expandir para o mercado de hospitais de pequeno porte. Rentabilidade de 18% a.a. com pagamento mensal após 6 meses de carência.",
    business_name: "MedFlow Tecnologia em Saúde S.A.",
    company_cnpj: "32.987.654/0001-12",
    whatsapp_group: "https://chat.whatsapp.com/medflow-investidores",
    promotional_video_url: null,
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
    warranty_amount: 200000,
    loor_fee_percent: 4,
    fundraising_completion: "all_or_nothing",
    resource_utilization: "Desenvolvimento IA, infraestrutura cloud, marketing B2B",
    is_private: false,
    members: [
      { id: "m4", name: "Dra. Beatriz Almeida", role: "CEO & Fundadora", avatar_url: "https://i.pravatar.cc/150?u=beatriz" },
      { id: "m5", name: "Thiago Rocha", role: "CTO", avatar_url: "https://i.pravatar.cc/150?u=thiago" },
    ],
    investor_list: [
      { id: "inv6", name: "Roberto Nunes", email: "roberto@email.com", cpf_masked: "***.***.***-11", invested_amount: 20000, quotas: 10, status: "paid", invested_at: "2026-03-20" },
      { id: "inv7", name: "Camila Dias", email: "camila@email.com", cpf_masked: "***.***.***-22", invested_amount: 40000, quotas: 20, status: "paid", invested_at: "2026-03-25" },
      { id: "inv8", name: "André Martins", email: "andre@email.com", cpf_masked: "***.***.***-33", invested_amount: 10000, quotas: 5, status: "reserved", invested_at: "2026-06-18" },
    ],
    debt: {
      type: "debt",
      percentage_profitability: 18,
      payment_frequency: "monthly",
      grace_period: 6,
      total_installments: 24,
      single_installment: false,
      installments: [
        { id: "inst1", number: 1, amount: 36667, due_date: "2026-10-15", paid_at: null, status: "pending" },
        { id: "inst2", number: 2, amount: 36667, due_date: "2026-11-15", paid_at: null, status: "pending" },
        { id: "inst3", number: 3, amount: 36667, due_date: "2026-12-15", paid_at: null, status: "pending" },
        { id: "inst4", number: 4, amount: 36667, due_date: "2027-01-15", paid_at: null, status: "pending" },
        { id: "inst5", number: 5, amount: 36667, due_date: "2027-02-15", paid_at: null, status: "pending" },
        { id: "inst6", number: 6, amount: 36667, due_date: "2027-03-15", paid_at: null, status: "pending" },
        { id: "inst7", number: 7, amount: 36667, due_date: "2027-04-15", paid_at: null, status: "pending" },
        { id: "inst8", number: 8, amount: 36667, due_date: "2027-05-15", paid_at: null, status: "pending" },
        { id: "inst9", number: 9, amount: 36667, due_date: "2027-06-15", paid_at: null, status: "pending" },
        { id: "inst10", number: 10, amount: 36667, due_date: "2027-07-15", paid_at: null, status: "pending" },
        { id: "inst11", number: 11, amount: 36667, due_date: "2027-08-15", paid_at: null, status: "pending" },
        { id: "inst12", number: 12, amount: 36667, due_date: "2027-09-15", paid_at: null, status: "pending" },
      ],
    },
  },
  {
    id: "c3",
    name: "EduPlay Kids",
    modality: "equity",
    goal: 500000,
    min_goal: 330000,
    raised: 175000,
    investors: 34,
    quota_value: 1000,
    total_quotas: 500,
    available_quotas: 325,
    status: "active",
    due_at: "2026-09-10",
    opened_at: "2026-05-01",
    segment: "Educação",
    description: "Plataforma gamificada de educação infantil que transforma aprendizagem em aventura, com conteúdos alinhados à BNCC para crianças de 4 a 10 anos.",
    about: "A EduPlay Kids já tem 15.000 assinantes ativos e parcerias com 80 escolas particulares. O investimento será usado para expandir o catálogo de conteúdos, desenvolver app offline e iniciar operação em Portugal e Angola.",
    business_name: "EduPlay Tecnologia Educacional Ltda",
    company_cnpj: "28.456.789/0001-55",
    whatsapp_group: "https://chat.whatsapp.com/eduplay-investidores",
    promotional_video_url: "https://www.youtube.com/watch?v=example3",
    image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    warranty_amount: 50000,
    loor_fee_percent: 5,
    fundraising_completion: "flexible",
    resource_utilization: "Produção de conteúdo, desenvolvimento mobile, expansão internacional",
    is_private: false,
    members: [
      { id: "m6", name: "Juliana Barros", role: "CEO", avatar_url: "https://i.pravatar.cc/150?u=juliana" },
      { id: "m7", name: "Marcos Tavares", role: "Head de Conteúdo", avatar_url: "https://i.pravatar.cc/150?u=marcos" },
      { id: "m8", name: "Patrícia Lopes", role: "Diretora Pedagógica", avatar_url: "https://i.pravatar.cc/150?u=patricia" },
    ],
    investor_list: [
      { id: "inv9", name: "Gabriel Moreira", email: "gabriel@email.com", cpf_masked: "***.***.***-44", invested_amount: 5000, quotas: 5, status: "paid", invested_at: "2026-05-10" },
      { id: "inv10", name: "Larissa Campos", email: "larissa@email.com", cpf_masked: "***.***.***-55", invested_amount: 30000, quotas: 30, status: "paid", invested_at: "2026-05-15" },
    ],
    equity: { type: "equity", participation: 8.0 },
  },
  {
    id: "c4",
    name: "FinPay Express",
    modality: "debt",
    goal: 2000000,
    min_goal: 1320000,
    raised: 2000000,
    investors: 310,
    quota_value: 5000,
    total_quotas: 400,
    available_quotas: 0,
    status: "finished",
    due_at: "2026-05-01",
    opened_at: "2025-11-01",
    segment: "Fintech",
    description: "Infraestrutura de pagamentos instantâneos para PMEs com taxas competitivas e antecipação de recebíveis em até 1 hora.",
    about: "A FinPay processou R$ 850 milhões em transações no último ano. A captação via dívida de R$ 2M foi concluída com sucesso e os recursos estão sendo aplicados em expansão da carteira de crédito e desenvolvimento de API bancária white-label.",
    business_name: "FinPay Express Pagamentos S.A.",
    company_cnpj: "51.234.567/0001-99",
    whatsapp_group: "https://chat.whatsapp.com/finpay-investidores",
    promotional_video_url: "https://www.youtube.com/watch?v=example4",
    image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800",
    warranty_amount: 500000,
    loor_fee_percent: 3.5,
    fundraising_completion: "all_or_nothing",
    resource_utilization: "Expansão de crédito, desenvolvimento API white-label, compliance",
    is_private: false,
    members: [
      { id: "m9", name: "Rafael Mendonça", role: "CEO", avatar_url: "https://i.pravatar.cc/150?u=rafael" },
      { id: "m10", name: "Isabela Ramos", role: "CFO", avatar_url: "https://i.pravatar.cc/150?u=isabela" },
      { id: "m11", name: "Diego Santana", role: "CTO", avatar_url: "https://i.pravatar.cc/150?u=diego" },
      { id: "m12", name: "Carla Figueiredo", role: "Head Jurídico", avatar_url: "https://i.pravatar.cc/150?u=carla" },
    ],
    investor_list: [
      { id: "inv11", name: "Marcos Vieira", email: "marcos.v@email.com", cpf_masked: "***.***.***-66", invested_amount: 50000, quotas: 10, status: "paid", invested_at: "2025-11-05" },
      { id: "inv12", name: "Renata Gomes", email: "renata@email.com", cpf_masked: "***.***.***-77", invested_amount: 100000, quotas: 20, status: "paid", invested_at: "2025-11-10" },
      { id: "inv13", name: "Paulo Ribeiro", email: "paulo@email.com", cpf_masked: "***.***.***-88", invested_amount: 25000, quotas: 5, status: "paid", invested_at: "2025-11-20" },
    ],
    debt: {
      type: "debt",
      percentage_profitability: 15.5,
      payment_frequency: "monthly",
      grace_period: 3,
      total_installments: 18,
      single_installment: false,
      installments: [
        { id: "inst20", number: 1, amount: 122222, due_date: "2026-02-01", paid_at: "2026-02-01", status: "paid" },
        { id: "inst21", number: 2, amount: 122222, due_date: "2026-03-01", paid_at: "2026-03-01", status: "paid" },
        { id: "inst22", number: 3, amount: 122222, due_date: "2026-04-01", paid_at: "2026-04-01", status: "paid" },
        { id: "inst23", number: 4, amount: 122222, due_date: "2026-05-01", paid_at: "2026-05-01", status: "paid" },
        { id: "inst24", number: 5, amount: 122222, due_date: "2026-06-01", paid_at: "2026-06-01", status: "paid" },
        { id: "inst25", number: 6, amount: 122222, due_date: "2026-07-01", paid_at: null, status: "pending" },
        { id: "inst26", number: 7, amount: 122222, due_date: "2026-08-01", paid_at: null, status: "pending" },
        { id: "inst27", number: 8, amount: 122222, due_date: "2026-09-01", paid_at: null, status: "pending" },
        { id: "inst28", number: 9, amount: 122222, due_date: "2026-10-01", paid_at: null, status: "pending" },
        { id: "inst29", number: 10, amount: 122222, due_date: "2026-11-01", paid_at: null, status: "pending" },
      ],
    },
  },
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