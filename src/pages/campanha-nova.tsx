import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileText,
  Image,
  Landmark,
  Loader2,
  LockKeyhole,
  MapPin,
  Megaphone,
  ShieldCheck,
  ShieldAlert,
  UsersRound,
  Video,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CampaignCreationStatusCard,
  CampaignPrerequisiteList,
} from "@/components/campaign-launch-guard";
import { FileUploadCard, SelectedFileCard } from "@/components/upload/file-upload-card";
import { cn } from "@/lib/utils";
import {
  getCountryValueForNewDraft,
  getCountryValueForReset,
  isBrazilCountry,
  normalizeSubdivisionForPayload,
  toNumericPayloadId,
  type CountryReference,
} from "@/features/campaign-creation/opportunity-creation";
import { getBlockingPrerequisites, useCampaignReadiness } from "@/hooks/use-campaign-readiness";
import { lookupCep } from "@/utils/brasil-api";
import {
  formatAccountDigit,
  formatAgency,
  formatBankAccount,
  formatCep,
  formatCnpj,
  formatCpf,
  formatDecimalInput,
  isValidCepShape,
  normalizePixKeyByType,
  onlyDigits,
  parseMoneyToNumber,
} from "@/utils/br-formatters";
import {
  formatUploadSize,
  getUploadAccept,
  normalizeUploadFilename,
  validateUploadFile,
} from "@/utils/upload-validation";
import {
  createOpportunity,
  getBanks,
  getCountries,
  getSegments,
  getWarranties,
  uploadImage,
} from "@/services/api";
import { toast } from "sonner";

type CampaignModality = "debt" | "equity";
type DocumentType = "cnpj" | "cpf";
type PrivacyMode = "public" | "private";
type WizardStep =
  | "modality"
  | "basics"
  | "financial"
  | "target"
  | "operations"
  | "banking"
  | "media"
  | "review";

type WizardValidation = Record<WizardStep, boolean>;

type SubmitErrorState = {
  message: string;
  step?: WizardStep;
  items?: SubmitErrorItem[];
} | null;

type SubmitErrorItem = {
  key: string;
  field: string;
  label: string;
  message: string;
  step: WizardStep;
  stepLabel: string;
  focusId?: string;
};

type ReferenceOption = {
  id: number;
  name: string;
};

type CountryOption = ReferenceOption & CountryReference;

type CampaignDraft = {
  modality: CampaignModality | null;
  opportunityName: string;
  documentNumber: string;
  responsibleCpf: string;
  speCnpj: string;
  segment: string;
  resourceUtilization: string;
  shortDescription: string;
  longDescription: string;
  videoUrl: string;
  whatsapp: string;
  profitability: string;
  installments: string;
  paymentFrequency: string;
  equityPercentage: string;
  targetAmount: string;
  shareValue: string;
  guarantees: string;
  teamMembers: string;
  countryId: string;
  zipCode: string;
  state: string;
  city: string;
  district: string;
  street: string;
  number: string;
  warrantyId: string;
  bankName: string;
  agency: string;
  account: string;
  accountDigit: string;
  pixType: string;
  pixKey: string;
  privacy: PrivacyMode;
  allowedCpfs: string;
  cardTitle: string;
  cardSubtitle: string;
  cardLongText: string;
  heroImageNote: string;
  heroImageFile: File | null;
  galleryNotes: string;
  extraImageFiles: File[];
  extraVideoUrl: string;
  safeReviewAccepted: boolean;
};

type StepConfig = {
  id: WizardStep;
  label: string;
  description: string;
  icon: LucideIcon;
};

const INITIAL_DRAFT: CampaignDraft = {
  modality: null,
  opportunityName: "",
  documentNumber: "",
  responsibleCpf: "",
  speCnpj: "",
  segment: "",
  resourceUtilization: "",
  shortDescription: "",
  longDescription: "",
  videoUrl: "",
  whatsapp: "",
  profitability: "",
  installments: "",
  paymentFrequency: "",
  equityPercentage: "",
  targetAmount: "",
  shareValue: "",
  guarantees: "",
  teamMembers: "",
  countryId: "",
  zipCode: "",
  state: "",
  city: "",
  district: "",
  street: "",
  number: "",
  warrantyId: "",
  bankName: "",
  agency: "",
  account: "",
  accountDigit: "",
  pixType: "cpf",
  pixKey: "",
  privacy: "public",
  allowedCpfs: "",
  cardTitle: "",
  cardSubtitle: "",
  cardLongText: "",
  heroImageNote: "",
  heroImageFile: null,
  galleryNotes: "",
  extraImageFiles: [],
  extraVideoUrl: "",
  safeReviewAccepted: false,
};

const WIZARD_STEPS: StepConfig[] = [
  {
    id: "modality",
    label: "Modalidade",
    description: "Dívida ou participação",
    icon: Megaphone,
  },
  {
    id: "basics",
    label: "Dados básicos",
    description: "Identificação e narrativa",
    icon: Building2,
  },
  {
    id: "financial",
    label: "Financeiro",
    description: "Campos condicionais",
    icon: Banknote,
  },
  {
    id: "target",
    label: "Meta e cotas",
    description: "Cálculo local",
    icon: Calculator,
  },
  {
    id: "operations",
    label: "Operação",
    description: "Garantias, equipe e endereço",
    icon: UsersRound,
  },
  {
    id: "banking",
    label: "Bancário",
    description: "Conta, Pix e privacidade",
    icon: WalletCards,
  },
  {
    id: "media",
    label: "Card e mídia",
    description: "Textos e referências visuais",
    icon: Image,
  },
  {
    id: "review",
    label: "Revisão",
    description: "Confirmação visual segura",
    icon: ClipboardCheck,
  },
];

const FREQUENCY_OPTIONS = [
  { label: "Mensal", value: "mensal" },
  { label: "Bimestral", value: "bimestral" },
  { label: "Trimestral", value: "trimestral" },
  { label: "Semestral", value: "semestral" },
  { label: "Anual", value: "anual" },
  { label: "Única", value: "unica" },
];

const PIX_TYPES = [
  { label: "CPF", value: "cpf" },
  { label: "CNPJ", value: "cnpj" },
  { label: "Telefone", value: "phone" },
  { label: "E-mail", value: "email" },
  { label: "Chave aleatória", value: "random" },
];

const RESOURCE_UTILIZATION_OPTIONS = [
  { label: "Capital de giro", value: "working_capital" },
  { label: "Refinanciamento de dívida", value: "debt_refinancing" },
  { label: "Investimento na oportunidade", value: "investment_in_the_opportunity" },
];

const IMAGE_MAX_SIZE = 2 * 1024 * 1024;
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const SHORT_DESCRIPTION_MIN_LENGTH = 20;
const LONG_DESCRIPTION_MIN_LENGTH = 80;
const CARD_TITLE_MIN_LENGTH = 5;
const CARD_SUBTITLE_MIN_LENGTH = 20;
const CARD_LONG_TEXT_MIN_LENGTH = 80;

const SUBMIT_ERROR_FIELD_META: Record<
  string,
  {
    label: string;
    step: WizardStep;
    focusId?: string;
  }
> = {
  "opportunity.company_cnpj": {
    label: "CNPJ da empresa",
    step: "basics",
    focusId: "documentNumber",
  },
  "opportunity.spe_cnpj": {
    label: "CNPJ da SPE",
    step: "basics",
    focusId: "speCnpj",
  },
  "opportunity.segment_id": {
    label: "Segmento",
    step: "basics",
    focusId: "segment",
  },
  "opportunity.image_id": {
    label: "Imagem principal",
    step: "media",
    focusId: "heroImageFile",
  },
  "bank_account.bank_id": {
    label: "Banco",
    step: "banking",
    focusId: "bankName",
  },
  "pix.key": {
    label: "Chave Pix",
    step: "banking",
    focusId: "pixKey",
  },
  "pix.type": {
    label: "Tipo de chave Pix",
    step: "banking",
    focusId: "pixType",
  },
  "debt.payment_frequency": {
    label: "Frequência de pagamento",
    step: "financial",
    focusId: "paymentFrequency",
  },
  resource_utilization: {
    label: "Uso dos recursos",
    step: "basics",
    focusId: "resourceUtilization",
  },
  "opportunity.resource_utilization": {
    label: "Uso dos recursos",
    step: "basics",
    focusId: "resourceUtilization",
  },
};

const REQUIRED_STEPS: WizardStep[] = [
  "modality",
  "basics",
  "financial",
  "target",
  "operations",
  "banking",
  "media",
];

const STEP_BLOCKING_MESSAGES: Record<WizardStep, string> = {
  modality: "Escolha uma modalidade antes de avançar.",
  basics: "Revise os dados básicos: documentos, segmento, uso dos recursos, WhatsApp e descrições.",
  financial: "Complete os dados financeiros da modalidade escolhida.",
  target: "Informe meta e valor por cota válidos.",
  operations: "Complete equipe e endereço da operação.",
  banking: "Revise banco, agência, conta e chave Pix.",
  media: "Complete card, textos e imagem principal antes da revisão.",
  review: "Confirme a ação persistente antes do envio final.",
};

const UF_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const MODALITY_OPTIONS: Array<{
  id: CampaignModality;
  title: string;
  badge: string;
  description: string;
  details: string[];
  icon: LucideIcon;
}> = [
  {
    id: "debt",
    title: "Dívida",
    badge: "Debt",
    description:
      "Captação com obrigação de pagamento, remuneração e prazo definidos nos próximos passos.",
    details: [
      "Indicado para ofertas com cronograma financeiro claro.",
      "Condições, garantias e remuneração ficam registradas apenas como rascunho local.",
    ],
    icon: Banknote,
  },
  {
    id: "equity",
    title: "Equity",
    badge: "Participação",
    description:
      "Captação com participação societária ou econômica definida na estrutura da oportunidade.",
    details: [
      "Indicado para ofertas baseadas em participação no negócio.",
      "Percentuais, direitos e documentos ficam apenas na experiência visual.",
    ],
    icon: BarChart3,
  },
];

const modalityLabel: Record<CampaignModality, string> = {
  debt: "Dívida",
  equity: "Equity",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getDataArray<T extends ReferenceOption = ReferenceOption>(response: unknown): T[] {
  if (!response || typeof response !== "object") return [];

  const data = (response as { data?: unknown }).data;

  return Array.isArray(data) ? (data as T[]) : [];
}

function getResponseData(response: unknown): Record<string, unknown> | null {
  if (!response || typeof response !== "object") return null;

  const data = (response as { data?: unknown }).data ?? response;

  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

function fieldHasText(value: string, minLength = 1) {
  return value.trim().length >= minLength;
}

function isValidOptionalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return true;
  if (trimmed === "https://" || trimmed === "https://...") return false;

  try {
    const url = new URL(trimmed);

    return ["http:", "https:"].includes(url.protocol) && fieldHasText(url.hostname, 3);
  } catch {
    return false;
  }
}

function isValidWhatsAppGroupUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "https://chat.whatsapp.com/...") return false;

  try {
    const url = new URL(trimmed);

    return url.protocol === "https:" && url.hostname === "chat.whatsapp.com" && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function toPositiveNumber(value: string) {
  return parseMoneyToNumber(value);
}

function toInteger(value: string) {
  const numeric = Number.parseInt(onlyDigits(value), 10);

  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0);
}

function isValidDocument(value: string, type: DocumentType) {
  return onlyDigits(value).length === (type === "cnpj" ? 14 : 11);
}

function validateImage(file: File) {
  return validateUploadFile(file, {
    allowedExtensions: IMAGE_EXTENSIONS,
    maxSizeBytes: IMAGE_MAX_SIZE,
    invalidTypeMessage: "Use uma imagem PNG, JPG ou JPEG.",
    maxSizeMessage: "A imagem deve ter até 2 MB.",
  });
}

function getImageFileSummary(file: File) {
  return `${file.name} · ${formatUploadSize(file.size)}`;
}

async function uploadCampaignImage(file: File, folder: "opportunities/banner" | "opportunities/extra_images") {
  const formData = new FormData();
  formData.append("image", normalizeUploadFilename(file));
  formData.append("folder", folder);

  const response = await uploadImage(formData);
  const data = getResponseData(response);
  const id = Number(data?.id);

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Upload de imagem não retornou identificador válido.");
  }

  return id;
}

function normalizePixKey(type: string, value: string) {
  return normalizePixKeyByType(type, value);
}

function isValidPix(type: string, value: string) {
  const key = normalizePixKey(type, value);

  if (type === "cpf") return /^\d{11}$/.test(key);
  if (type === "cnpj") return /^\d{14}$/.test(key);
  if (type === "phone") return /^\+55\d{2}\d{9}$/.test(key);
  if (type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
  if (type === "random") {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key);
  }

  return false;
}

function getOptionName(options: ReferenceOption[], id: string) {
  return options.find((option) => String(option.id) === id)?.name || "Não informado";
}

function hasReferenceId(options: ReferenceOption[], id: string) {
  if (!id) return false;
  if (options.length === 0) return true;

  return options.some((option) => String(option.id) === id);
}

function getStepIndex(step: WizardStep) {
  return WIZARD_STEPS.findIndex((item) => item.id === step);
}

function getQuotaCount(targetAmount: string, shareValue: string) {
  const target = toPositiveNumber(targetAmount);
  const share = toPositiveNumber(shareValue);

  if (!target || !share) return 0;
  return Math.floor(target / share);
}

function getDraftValidation(
  draft: CampaignDraft,
  segments: ReferenceOption[] = [],
  banks: ReferenceOption[] = [],
  countries: CountryOption[] = [],
): WizardValidation {
  const target = toPositiveNumber(draft.targetAmount);
  const share = toPositiveNumber(draft.shareValue);
  const quotaCount = getQuotaCount(draft.targetAmount, draft.shareValue);
  const basicsValid =
    fieldHasText(draft.opportunityName, 3) &&
    isValidDocument(draft.documentNumber, "cnpj") &&
    isValidDocument(draft.responsibleCpf, "cpf") &&
    isValidDocument(draft.speCnpj, "cnpj") &&
    hasReferenceId(segments, draft.segment) &&
    fieldHasText(draft.resourceUtilization) &&
    isValidWhatsAppGroupUrl(draft.whatsapp) &&
    isValidOptionalUrl(draft.videoUrl) &&
    fieldHasText(draft.shortDescription, SHORT_DESCRIPTION_MIN_LENGTH) &&
    fieldHasText(draft.longDescription, LONG_DESCRIPTION_MIN_LENGTH);

  const debtValid =
    draft.modality === "debt" &&
    toPositiveNumber(draft.profitability) > 0 &&
    Number.parseInt(draft.installments, 10) > 0 &&
    fieldHasText(draft.paymentFrequency);

  const equityValid =
    draft.modality === "equity" &&
    toPositiveNumber(draft.equityPercentage) > 0 &&
    toPositiveNumber(draft.equityPercentage) <= 100;

  const targetValid =
    target >= 100 &&
    share >= 100 &&
    quotaCount > 0 &&
    quotaCount <= 9999 &&
    target % share === 0;

  const selectedCountry = countries.find((country) => String(country.id) === draft.countryId) ?? null;
  const brazilSelected = isBrazilCountry(selectedCountry);
  const operationsValid =
    fieldHasText(draft.teamMembers, 10) &&
    Boolean(draft.countryId) &&
    hasReferenceId(countries, draft.countryId) &&
    (brazilSelected ? isValidCepShape(draft.zipCode) : fieldHasText(draft.zipCode)) &&
    (brazilSelected ? UF_OPTIONS.includes(draft.state) : fieldHasText(draft.state, 2)) &&
    fieldHasText(draft.city, 2) &&
    fieldHasText(draft.street, 3) &&
    fieldHasText(draft.number);

  const bankingValid =
    hasReferenceId(banks, draft.bankName) &&
    onlyDigits(draft.agency).length === 4 &&
    onlyDigits(draft.account).length >= 5 &&
    onlyDigits(draft.account).length <= 16 &&
    onlyDigits(draft.accountDigit).length === 1 &&
    isValidPix(draft.pixType, draft.pixKey) &&
    (draft.privacy === "public" || fieldHasText(draft.allowedCpfs, 11));

  const mediaValid =
    fieldHasText(draft.cardTitle, CARD_TITLE_MIN_LENGTH) &&
    fieldHasText(draft.cardSubtitle, CARD_SUBTITLE_MIN_LENGTH) &&
    fieldHasText(draft.cardLongText, CARD_LONG_TEXT_MIN_LENGTH) &&
    draft.heroImageFile !== null &&
    isValidOptionalUrl(draft.extraVideoUrl);

  const requiredValid = [
    draft.modality !== null,
    basicsValid,
    debtValid || equityValid,
    targetValid,
    operationsValid,
    bankingValid,
    mediaValid,
  ].every(Boolean);

  return {
    modality: draft.modality !== null,
    basics: basicsValid,
    financial: debtValid || equityValid,
    target: targetValid,
    operations: operationsValid,
    banking: bankingValid,
    media: mediaValid,
    review: requiredValid && draft.safeReviewAccepted,
  };
}

function getFirstInvalidRequiredStep(validation: WizardValidation) {
  return REQUIRED_STEPS.find((step) => !validation[step]) ?? null;
}

function canEnterWizardStep(step: WizardStep, validation: WizardValidation) {
  const targetIndex = getStepIndex(step);

  if (targetIndex <= 0) return true;

  return WIZARD_STEPS.slice(0, targetIndex).every((previous) => validation[previous.id]);
}

function getBlockingStepFor(step: WizardStep, validation: WizardValidation) {
  const targetIndex = getStepIndex(step);

  return WIZARD_STEPS.slice(0, targetIndex).find((previous) => !validation[previous.id])?.id ?? null;
}

function getCharacterHint(value: string, minLength: number, maxLength?: number) {
  const current = value.trim().length;
  const minStatus = current >= minLength ? "mínimo OK" : `faltam ${minLength - current}`;
  const maxStatus = maxLength ? ` de ${maxLength}` : "";

  return `${current}${maxStatus} caracteres · ${minStatus}`;
}

function getMediaPendingItems(draft: CampaignDraft) {
  const pending: string[] = [];

  if (!fieldHasText(draft.cardTitle, CARD_TITLE_MIN_LENGTH)) {
    pending.push(`Título do card: informe pelo menos ${CARD_TITLE_MIN_LENGTH} caracteres.`);
  }

  if (!fieldHasText(draft.cardSubtitle, CARD_SUBTITLE_MIN_LENGTH)) {
    pending.push(`Texto curto: informe pelo menos ${CARD_SUBTITLE_MIN_LENGTH} caracteres.`);
  }

  if (!fieldHasText(draft.cardLongText, CARD_LONG_TEXT_MIN_LENGTH)) {
    pending.push(`Texto longo: informe pelo menos ${CARD_LONG_TEXT_MIN_LENGTH} caracteres.`);
  }

  if (!draft.heroImageFile) {
    pending.push("Imagem principal: selecione um arquivo PNG/JPG até 2 MB.");
  }

  if (draft.extraVideoUrl.trim() && !isValidOptionalUrl(draft.extraVideoUrl)) {
    pending.push("URL complementar: informe uma URL completa ou deixe o campo vazio.");
  }

  return pending;
}

function getStepLabel(step: WizardStep) {
  return WIZARD_STEPS.find((item) => item.id === step)?.label ?? "Etapa";
}

function getSubmitErrorMeta(field: string) {
  const directMeta = SUBMIT_ERROR_FIELD_META[field];
  if (directMeta) return directMeta;

  if (field.startsWith("debt.")) {
    return { label: "Dados financeiros", step: "financial" as const };
  }

  if (field.startsWith("equity.")) {
    return { label: "Dados financeiros", step: "financial" as const };
  }

  if (field.startsWith("bank_account.")) {
    return { label: "Dados bancários", step: "banking" as const };
  }

  if (field.startsWith("pix.")) {
    return { label: "Dados Pix", step: "banking" as const };
  }

  if (field.startsWith("opportunity.")) {
    return { label: "Dados da oportunidade", step: "basics" as const };
  }

  return undefined;
}

function getBackendErrorEntries(error: unknown) {
  if (!error || typeof error !== "object") return [];

  const record = error as Record<string, unknown>;
  const errors = Array.isArray(record.errors) ? record.errors : [];

  return errors.filter((item): item is Record<string, unknown> => {
    return Boolean(item && typeof item === "object" && !Array.isArray(item));
  });
}

function getFriendlySubmitErrorMessage(field: string, rule: string, fallbackMessage: string) {
  if (rule === "unique" && field === "opportunity.company_cnpj") {
    return "Este CNPJ da empresa já está sendo usado em outra oportunidade. Informe outro CNPJ ou confirme se a oportunidade já foi cadastrada.";
  }

  if (rule === "unique" && field === "opportunity.spe_cnpj") {
    return "Este CNPJ da SPE já está sendo usado em outra oportunidade. Informe outro CNPJ de SPE.";
  }

  const meta = getSubmitErrorMeta(field);

  if (rule === "unique" && meta) {
    return `${meta.label} já está sendo usado em outra oportunidade. Revise o campo antes de tentar novamente.`;
  }

  if (meta) {
    return fallbackMessage && !fallbackMessage.includes(field)
      ? fallbackMessage
      : `Revise ${meta.label.toLowerCase()} antes de tentar novamente.`;
  }

  return fallbackMessage || "Revise este campo antes de tentar novamente.";
}

function getSubmitErrorItems(error: unknown): SubmitErrorItem[] {
  return getBackendErrorEntries(error)
    .map((entry, index) => {
      const field = typeof entry.field === "string" ? entry.field : "";
      const rule = typeof entry.rule === "string" ? entry.rule : "";
      const backendMessage = typeof entry.message === "string" ? entry.message : "";
      const meta = field ? getSubmitErrorMeta(field) : undefined;

      if (!field || !meta) return null;

      const message = getFriendlySubmitErrorMessage(field, rule, backendMessage);

      return {
        key: `${field}-${index}`,
        field,
        label: meta.label,
        message,
        step: meta.step,
        stepLabel: getStepLabel(meta.step),
        focusId: meta.focusId,
      };
    })
    .filter((item): item is SubmitErrorItem => item !== null);
}

function getSubmitFieldError(submitError: SubmitErrorState, field: string) {
  return submitError?.items?.find((item) => item.field === field);
}

function stringifyErrorShape(error: unknown) {
  if (!error || typeof error !== "object") return String(error ?? "").toLowerCase();

  const keys: string[] = [];

  function visit(value: unknown, prefix = "") {
    if (!value || typeof value !== "object") return;

    Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      keys.push(path.toLowerCase());
      visit(nested, path);
    });
  }

  visit(error);

  return keys.join(" ");
}

function getSubmitErrorStep(error: unknown): WizardStep | undefined {
  const shape = stringifyErrorShape(error);

  if (/image|extra_images|media/.test(shape)) return "media";
  if (/bank|pix|agency|account|allowed_cpfs|is_private/.test(shape)) return "banking";
  if (/address|city|state|district|street|zip|number|warrant/.test(shape)) return "operations";
  if (/debt|equity|installment|payment_frequency|profitability|participation/.test(shape)) {
    return "financial";
  }
  if (/goal|min_investment|monetary|quota|target/.test(shape)) return "target";
  if (/segment|resource|company_cnpj|spe_cnpj|cpf|whatsapp|video|description|name/.test(shape)) {
    return "basics";
  }

  return undefined;
}

function getSubmitErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (Number(record.status) === 422) {
      return "Não foi possível criar a oportunidade. Revise os dados informados e tente novamente.";
    }
  }

  return "Não foi possível criar a oportunidade. Revise os dados informados e tente novamente.";
}

function normalizeSubmitError(error: unknown): Exclude<SubmitErrorState, null> {
  const items = getSubmitErrorItems(error);

  if (items.length > 0) {
    return {
      message: "Revise os campos abaixo antes de tentar novamente.",
      step: items[0].step,
      items,
    };
  }

  return {
    message: getSubmitErrorMessage(error),
    step: getSubmitErrorStep(error),
  };
}

function FormField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FieldHint({ valid, message }: { valid: boolean; message: string }) {
  return (
    <p className={cn("text-xs leading-relaxed", valid ? "text-emerald-700" : "text-destructive")}>
      {message}
    </p>
  );
}

function getDocumentHint(value: string, type: DocumentType, label: string) {
  const digits = onlyDigits(value).length;
  const expected = type === "cnpj" ? 14 : 11;
  const valid = digits === expected;

  if (!digits) return null;

  return (
    <FieldHint
      valid={valid}
      message={
        valid
          ? `${label} completo.`
          : `${label} incompleto: ${digits}/${expected} dígitos.`
      }
    />
  );
}

function getMoneyHint(value: string, label: string, minValue = 100) {
  const amount = toPositiveNumber(value);

  if (!value.trim()) return null;

  return (
    <FieldHint
      valid={amount >= minValue}
      message={
        amount >= minValue
          ? `${label}: ${formatCurrency(amount)}.`
          : `${label} deve ser maior ou igual a ${formatCurrency(minValue)}.`
      }
    />
  );
}

function formatPixDraftValue(type: string, value: string) {
  if (type === "cpf") return formatCpf(value);
  if (type === "cnpj") return formatCnpj(value);
  if (type === "phone") {
    const digits = onlyDigits(value);
    const localDigits = digits.startsWith("55") && digits.length > 11 ? digits.slice(-11) : digits;

    return localDigits
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return value.trimStart().slice(0, type === "random" ? 36 : 120);
}

function formatAllowedCpfList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => formatCpf(item))
    .filter(Boolean)
    .join(", ")
    .slice(0, 240);
}

function StepActions({
  canContinue,
  onBack,
  onContinue,
  continueLabel = "Continuar",
}: {
  canContinue: boolean;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onContinue} disabled={!canContinue}>
        {continueLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function SubmitErrorAlert({
  submitError,
  onSelectItem,
}: {
  submitError: SubmitErrorState;
  onSelectItem?: (item: SubmitErrorItem) => void;
}) {
  if (!submitError) return null;

  const hasItems = Boolean(submitError.items?.length);

  return (
    <Alert variant="destructive">
      <CircleAlert className="h-4 w-4" />
      <AlertTitle>Não foi possível criar a oportunidade</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {hasItems
            ? "Revise os campos abaixo antes de tentar novamente."
            : submitError.message}
        </p>
        {hasItems && (
          <ul className="space-y-2">
            {submitError.items?.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onSelectItem?.(item)}
                  className="w-full rounded-md border border-destructive/30 bg-background/60 px-3 py-2 text-left text-sm transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                >
                  <span className="font-semibold">
                    {item.stepLabel} · {item.label}:
                  </span>{" "}
                  {item.message}
                </button>
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}

function CampaignWizardProgress({
  currentStep,
  validation,
  submitError,
}: {
  currentStep: WizardStep;
  validation: WizardValidation;
  submitError?: SubmitErrorState;
}) {
  const activeIndex = getStepIndex(currentStep);

  return (
    <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
      {WIZARD_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isDone = validation[step.id] && index < activeIndex;
        const isFuture = index > activeIndex;
        const isPendingPast = index < activeIndex && !validation[step.id];
        const hasSubmitError = submitError?.items?.some((item) => item.step === step.id);

        return (
          <div
            key={step.id}
            className={cn(
              "flex min-h-28 flex-col gap-3 rounded-lg border p-3 transition-colors",
              isActive && "border-primary bg-primary/5",
              isDone && "border-emerald-200 bg-emerald-50 text-emerald-900",
              isPendingPast && "border-destructive/40 bg-destructive/5 text-foreground",
              isFuture && "border-border bg-card text-muted-foreground",
              hasSubmitError && "border-destructive bg-destructive/5 text-foreground",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                isActive && "border-primary bg-primary text-primary-foreground",
                isDone && "border-emerald-500 bg-emerald-500 text-white",
                isPendingPast && "border-destructive bg-destructive text-destructive-foreground",
                isFuture && "border-border bg-background text-muted-foreground",
                hasSubmitError && "border-destructive bg-destructive text-destructive-foreground",
              )}
            >
              {hasSubmitError ? (
                <CircleAlert className="h-4 w-4" />
              ) : isDone ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{step.label}</p>
              <p className="text-xs leading-relaxed">{step.description}</p>
              {hasSubmitError && (
                <p className="text-xs font-medium text-destructive">Revise esta etapa.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModalityStep({
  draft,
  onPatch,
  onContinue,
}: {
  draft: CampaignDraft;
  onPatch: (patch: Partial<CampaignDraft>) => void;
  onContinue: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Etapa 1</Badge>
          <Badge variant="outline">Envio final</Badge>
        </div>
        <CardTitle>Modalidade da campanha</CardTitle>
        <CardDescription>
          Escolha a estrutura inicial da oportunidade. Esta seleção fica apenas nesta tela.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {MODALITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = draft.modality === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onPatch({ modality: option.id })}
                className={cn(
                  "flex h-full min-h-64 flex-col rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected && "border-primary bg-primary/5 shadow-sm",
                )}
                aria-pressed={isSelected}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-lg border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={isSelected ? "default" : "secondary"}>{option.badge}</Badge>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">{option.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {option.details.map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>

        <StepActions
          canContinue={draft.modality !== null}
          onContinue={onContinue}
          continueLabel="Continuar para dados básicos"
        />
      </CardContent>
    </Card>
  );
}

function BasicsStep({
  draft,
  segments,
  referencesLoading,
  onPatch,
  canContinue,
  onBack,
  onContinue,
  submitError,
}: {
  draft: CampaignDraft;
  segments: ReferenceOption[];
  referencesLoading: boolean;
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  submitError: SubmitErrorState;
}) {
  const companyCnpjError = getSubmitFieldError(submitError, "opportunity.company_cnpj");
  const speCnpjError = getSubmitFieldError(submitError, "opportunity.spe_cnpj");

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 2
        </Badge>
        <CardTitle>Dados básicos da oportunidade</CardTitle>
        <CardDescription>
          Estruture os dados exigidos pelo contrato de criação da oportunidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="opportunityName" label="Nome da oportunidade">
            <Input
              id="opportunityName"
              value={draft.opportunityName}
              onChange={(event) => onPatch({ opportunityName: event.target.value })}
              placeholder="Ex.: Expansão regional 2026"
            />
          </FormField>

          <FormField id="segment" label="Segmento">
            <Select value={draft.segment} onValueChange={(segment) => onPatch({ segment })}>
              <SelectTrigger id="segment">
                <SelectValue placeholder={referencesLoading ? "Carregando..." : "Selecione o segmento"} />
              </SelectTrigger>
              <SelectContent>
                {segments.map((segment) => (
                  <SelectItem key={segment.id} value={String(segment.id)}>
                    {segment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!referencesLoading && segments.length === 1 && (
              <FieldHint valid message="Segmento único carregado da API." />
            )}
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="documentNumber" label="CNPJ da empresa">
            <Input
              id="documentNumber"
              value={draft.documentNumber}
              onChange={(event) => onPatch({ documentNumber: formatCnpj(event.target.value) })}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              aria-invalid={Boolean(companyCnpjError)}
              className={cn(
                companyCnpjError && "border-destructive focus-visible:ring-destructive/40",
              )}
            />
            {companyCnpjError && (
              <p className="text-xs leading-relaxed text-destructive">
                {companyCnpjError.message}
              </p>
            )}
            {getDocumentHint(draft.documentNumber, "cnpj", "CNPJ da empresa")}
          </FormField>

          <FormField id="responsibleCpf" label="CPF do responsável">
            <Input
              id="responsibleCpf"
              value={draft.responsibleCpf}
              onChange={(event) => onPatch({ responsibleCpf: formatCpf(event.target.value) })}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            {getDocumentHint(draft.responsibleCpf, "cpf", "CPF do responsável")}
          </FormField>

          <FormField id="speCnpj" label="CNPJ da SPE">
            <Input
              id="speCnpj"
              value={draft.speCnpj}
              onChange={(event) => onPatch({ speCnpj: formatCnpj(event.target.value) })}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              aria-invalid={Boolean(speCnpjError)}
              className={cn(speCnpjError && "border-destructive focus-visible:ring-destructive/40")}
            />
            {speCnpjError && (
              <p className="text-xs leading-relaxed text-destructive">{speCnpjError.message}</p>
            )}
            {getDocumentHint(draft.speCnpj, "cnpj", "CNPJ da SPE")}
          </FormField>
        </div>

        <FormField id="resourceUtilization" label="Uso dos recursos">
          <Select
            value={draft.resourceUtilization}
            onValueChange={(resourceUtilization) => onPatch({ resourceUtilization })}
          >
            <SelectTrigger id="resourceUtilization">
              <SelectValue placeholder="Selecione a finalidade" />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_UTILIZATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          id="shortDescription"
          label="Descrição curta"
          hint={getCharacterHint(draft.shortDescription, SHORT_DESCRIPTION_MIN_LENGTH)}
        >
          <Input
            id="shortDescription"
            value={draft.shortDescription}
            onChange={(event) => onPatch({ shortDescription: event.target.value })}
            placeholder="Resumo da oportunidade para cards e listagens."
          />
        </FormField>

        <FormField
          id="longDescription"
          label="Descrição longa"
          hint={getCharacterHint(draft.longDescription, LONG_DESCRIPTION_MIN_LENGTH)}
        >
          <Textarea
            id="longDescription"
            value={draft.longDescription}
            onChange={(event) => onPatch({ longDescription: event.target.value })}
            placeholder="Explique contexto, tese, uso dos recursos e diferenciais da oportunidade."
            className="min-h-32"
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="videoUrl" label="Vídeo opcional" hint="Campo visual, sem upload.">
            <Input
              id="videoUrl"
              value={draft.videoUrl}
              onChange={(event) => onPatch({ videoUrl: event.target.value })}
              placeholder="https://..."
            />
            {draft.videoUrl.trim() && (
              <FieldHint
                valid={isValidOptionalUrl(draft.videoUrl)}
                message={
                  isValidOptionalUrl(draft.videoUrl)
                    ? "URL de vídeo válida."
                    : "Informe uma URL completa ou deixe o campo vazio."
                }
              />
            )}
          </FormField>

          <FormField
            id="whatsapp"
            label="Grupo de WhatsApp da oportunidade"
            hint="O backend exige um link iniciado por https://chat.whatsapp.com/."
          >
            <Input
              id="whatsapp"
              value={draft.whatsapp}
              onChange={(event) => onPatch({ whatsapp: event.target.value })}
              placeholder="https://chat.whatsapp.com/..."
            />
            {draft.whatsapp.trim() && (
              <FieldHint
                valid={isValidWhatsAppGroupUrl(draft.whatsapp)}
                message={
                  isValidWhatsAppGroupUrl(draft.whatsapp)
                    ? "Link de WhatsApp válido."
                    : "Use um link completo de grupo em https://chat.whatsapp.com/."
                }
              />
            )}
          </FormField>
        </div>

        <StepActions
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continuar para financeiro"
        />
      </CardContent>
    </Card>
  );
}

function FinancialStep({
  draft,
  onPatch,
  canContinue,
  onBack,
  onContinue,
}: {
  draft: CampaignDraft;
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Etapa 3</Badge>
          {draft.modality && <Badge>{modalityLabel[draft.modality]}</Badge>}
        </div>
        <CardTitle>Dados financeiros condicionais</CardTitle>
        <CardDescription>
          Os campos mudam conforme a modalidade escolhida e seguem os enums do backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {draft.modality === "debt" && (
          <div className="grid gap-4 md:grid-cols-3">
            <FormField id="profitability" label="Rentabilidade visual (%)">
              <Input
                id="profitability"
                inputMode="decimal"
                value={draft.profitability}
                onChange={(event) => onPatch({ profitability: formatDecimalInput(event.target.value) })}
                placeholder="Ex.: 14,5"
              />
              {draft.profitability.trim() && (
                <FieldHint
                  valid={toPositiveNumber(draft.profitability) > 0}
                  message={
                    toPositiveNumber(draft.profitability) > 0
                      ? "Rentabilidade informada."
                      : "Informe uma rentabilidade maior que zero."
                  }
                />
              )}
            </FormField>

            <FormField id="installments" label="Parcelas">
              <Input
                id="installments"
                inputMode="numeric"
                value={draft.installments}
                onChange={(event) =>
                  onPatch({ installments: onlyDigits(event.target.value).slice(0, 3) })
                }
                placeholder="Ex.: 24"
              />
            </FormField>

            <FormField id="paymentFrequency" label="Frequência">
              <Select
                value={draft.paymentFrequency}
                onValueChange={(paymentFrequency) => onPatch({ paymentFrequency })}
              >
                <SelectTrigger id="paymentFrequency">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((frequency) => (
                    <SelectItem key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        )}

        {draft.modality === "equity" && (
          <FormField
            id="equityPercentage"
            label="Participação visual (%)"
            hint="Informe uma participação maior que 0 e menor ou igual a 100."
          >
            <Input
              id="equityPercentage"
              inputMode="decimal"
              value={draft.equityPercentage}
              onChange={(event) => onPatch({ equityPercentage: formatDecimalInput(event.target.value) })}
              placeholder="Ex.: 12,5"
            />
            {draft.equityPercentage.trim() && (
              <FieldHint
                valid={
                  toPositiveNumber(draft.equityPercentage) > 0 &&
                  toPositiveNumber(draft.equityPercentage) <= 100
                }
                message={
                  toPositiveNumber(draft.equityPercentage) > 0 &&
                  toPositiveNumber(draft.equityPercentage) <= 100
                    ? "Participação dentro do intervalo permitido."
                    : "Informe um percentual maior que 0 e menor ou igual a 100."
                }
              />
            )}
          </FormField>
        )}

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Validação local</AlertTitle>
          <AlertDescription>
            Esta etapa só habilita a navegação do wizard. Nenhuma condição financeira foi persistida
            ou enviada para análise.
          </AlertDescription>
        </Alert>

        <StepActions
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continuar para meta"
        />
      </CardContent>
    </Card>
  );
}

function TargetStep({
  draft,
  onPatch,
  canContinue,
  onBack,
  onContinue,
}: {
  draft: CampaignDraft;
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const target = toPositiveNumber(draft.targetAmount);
  const share = toPositiveNumber(draft.shareValue);
  const quotaCount = getQuotaCount(draft.targetAmount, draft.shareValue);

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 4
        </Badge>
        <CardTitle>Meta, cotas e resumo monetário</CardTitle>
        <CardDescription>Cálculo local para orientar a revisão visual da campanha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="targetAmount" label="Meta de captação">
            <Input
              id="targetAmount"
              inputMode="decimal"
              value={draft.targetAmount}
              onChange={(event) => onPatch({ targetAmount: formatDecimalInput(event.target.value) })}
              placeholder="Ex.: 500000"
            />
            {getMoneyHint(draft.targetAmount, "Meta")}
          </FormField>

          <FormField id="shareValue" label="Valor por cota">
            <Input
              id="shareValue"
              inputMode="decimal"
              value={draft.shareValue}
              onChange={(event) => onPatch({ shareValue: formatDecimalInput(event.target.value) })}
              placeholder="Ex.: 1000"
            />
            {getMoneyHint(draft.shareValue, "Valor por cota")}
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Meta</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(target)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Valor por cota</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(share)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Quantidade visual de cotas</p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {quotaCount.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <StepActions
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continuar para operação"
        />
      </CardContent>
    </Card>
  );
}

function OperationsStep({
  draft,
  warranties,
  countries,
  onPatch,
  canContinue,
  onBack,
  onContinue,
}: {
  draft: CampaignDraft;
  warranties: ReferenceOption[];
  countries: CountryOption[];
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "found" | "missing" | "error">("idle");
  const lastRequestedCepRef = useRef("");
  const draftRef = useRef(draft);
  const selectedCountry = countries.find((country) => String(country.id) === draft.countryId) ?? null;
  const brazilSelected = isBrazilCountry(selectedCountry);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!brazilSelected) {
      lastRequestedCepRef.current = "";
      setCepStatus("idle");
      return;
    }

    const digits = onlyDigits(draft.zipCode);

    if (digits.length === 0) {
      lastRequestedCepRef.current = "";
      setCepStatus("idle");
      return;
    }

    if (digits.length < 8) {
      lastRequestedCepRef.current = "";
      setCepStatus("missing");
      return;
    }

    if (lastRequestedCepRef.current === digits) return;

    lastRequestedCepRef.current = digits;

    const controller = new AbortController();
    const currentDraft = draftRef.current;
    const snapshot = {
      state: currentDraft.state,
      city: currentDraft.city,
      district: currentDraft.district,
      street: currentDraft.street,
    };

    setCepStatus("loading");

    lookupCep(digits, controller.signal)
      .then((result) => {
        if (!result) {
          setCepStatus("error");
          return;
        }

        const patch: Partial<CampaignDraft> = {};

        if (!snapshot.state && result.state) patch.state = result.state;
        if (!snapshot.city && result.city) patch.city = result.city;
        if (!snapshot.district && result.neighborhood) patch.district = result.neighborhood;
        if (!snapshot.street && result.street) patch.street = result.street;

        if (Object.keys(patch).length > 0) onPatch(patch);
        setCepStatus("found");
      })
      .catch((error) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setCepStatus("error");
        }
      });

    return () => controller.abort();
  }, [brazilSelected, draft.zipCode, onPatch]);

  const handleCountryChange = (countryId: string) => {
    const nextCountry = countries.find((country) => String(country.id) === countryId) ?? null;
    const mustClearInvalidBrazilianState =
      isBrazilCountry(nextCountry) && draft.state && !UF_OPTIONS.includes(draft.state);

    onPatch({
      countryId,
      state: mustClearInvalidBrazilianState ? "" : draft.state,
    });
    lastRequestedCepRef.current = "";
    setCepStatus("idle");
  };

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 5
        </Badge>
        <CardTitle>Garantias, equipe e endereço</CardTitle>
        <CardDescription>
          Dados operacionais em rascunho local para completar a experiência do fluxo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField id="guarantees" label="Garantias opcionais">
          <Textarea
            id="guarantees"
            value={draft.guarantees}
            onChange={(event) => onPatch({ guarantees: event.target.value })}
            placeholder="Descreva garantias, mitigadores de risco ou deixe em branco."
          />
        </FormField>

        <FormField
          id="warrantyId"
          label="Garantia cadastrada"
          hint="Opcional. A seleção usa os IDs retornados por GET /entrepreneurs/warranties."
        >
          <Select value={draft.warrantyId || "none"} onValueChange={(value) => onPatch({ warrantyId: value === "none" ? "" : value })}>
            <SelectTrigger id="warrantyId">
              <SelectValue placeholder="Sem garantia vinculada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem garantia vinculada</SelectItem>
              {warranties.map((warranty) => (
                <SelectItem key={warranty.id} value={String(warranty.id)}>
                  {warranty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          id="teamMembers"
          label="Equipe responsável"
          hint="Informe nomes/cargos sintéticos ou autorizados."
        >
          <Textarea
            id="teamMembers"
            value={draft.teamMembers}
            onChange={(event) => onPatch({ teamMembers: event.target.value })}
            placeholder="Ex.: Diretoria financeira, operações, jurídico."
          />
        </FormField>

        <FormField
          id="countryId"
          label="País"
          hint="Brasil é selecionado automaticamente em novas oportunidades; você pode alterá-lo."
        >
          <SearchableCombobox
            id="countryId"
            value={draft.countryId}
            onValueChange={handleCountryChange}
            options={countries.map((country) => ({
              value: String(country.id),
              label: country.name,
              keywords: country.abbreviation ?? "",
            }))}
            placeholder="Selecione o país"
            searchPlaceholder="Buscar país..."
            emptyMessage="Nenhum país encontrado."
            disabled={countries.length === 0}
            aria-invalid={!draft.countryId}
          />
          {countries.length === 0 && (
            <FieldHint valid={false} message="Aguarde o carregamento dos países." />
          )}
        </FormField>

        <div className="grid gap-4 md:grid-cols-4">
          <FormField id="zipCode" label={brazilSelected ? "CEP" : "Código postal"}>
            <Input
              id="zipCode"
              value={draft.zipCode}
              onChange={(event) =>
                onPatch({
                  zipCode: brazilSelected ? formatCep(event.target.value) : event.target.value,
                })
              }
              placeholder={brazilSelected ? "00000-000" : "Código postal"}
              inputMode={brazilSelected ? "numeric" : "text"}
              aria-invalid={brazilSelected && cepStatus === "missing"}
            />
            {brazilSelected && cepStatus === "missing" && (
              <FieldHint
                valid={false}
                message={`${onlyDigits(draft.zipCode).length}/8 dígitos. Complete o CEP para buscar o endereço.`}
              />
            )}
            {brazilSelected && cepStatus === "loading" && <FieldHint valid message="Buscando endereço na BrasilAPI..." />}
            {brazilSelected && cepStatus === "found" && <FieldHint valid message="CEP encontrado. Campos vazios foram preenchidos." />}
            {brazilSelected && cepStatus === "error" && (
              <FieldHint
                valid={false}
                message="Não foi possível consultar o CEP agora. Você pode preencher o endereço manualmente."
              />
            )}
          </FormField>
          <FormField id="state" label={brazilSelected ? "UF" : "Estado / província / região"}>
            {brazilSelected ? (
              <Select value={draft.state} onValueChange={(state) => onPatch({ state })}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="state"
                value={draft.state}
                onChange={(event) => onPatch({ state: event.target.value })}
                placeholder="Estado, província ou região"
              />
            )}
          </FormField>
          <FormField id="city" label="Cidade">
            <Input
              id="city"
              value={draft.city}
              onChange={(event) => onPatch({ city: event.target.value })}
              placeholder="Cidade"
            />
          </FormField>
          <FormField id="district" label="Bairro">
            <Input
              id="district"
              value={draft.district}
              onChange={(event) => onPatch({ district: event.target.value })}
              placeholder="Bairro"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
          <FormField id="street" label="Endereço">
            <Input
              id="street"
              value={draft.street}
              onChange={(event) => onPatch({ street: event.target.value })}
              placeholder="Rua, avenida ou logradouro"
            />
          </FormField>
          <FormField id="number" label="Número">
            <Input
              id="number"
              value={draft.number}
              onChange={(event) => onPatch({ number: event.target.value })}
              placeholder="100"
            />
          </FormField>
        </div>

        <StepActions
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continuar para conta"
        />
      </CardContent>
    </Card>
  );
}

function BankingStep({
  draft,
  banks,
  onPatch,
  canContinue,
  onBack,
  onContinue,
}: {
  draft: CampaignDraft;
  banks: ReferenceOption[];
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 6
        </Badge>
        <CardTitle>Conta bancária, Pix e privacidade</CardTitle>
        <CardDescription>
          Campos visuais para compor o fluxo. Nenhum Pix, pagamento ou QR Code será criado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <FormField id="bankName" label="Banco">
            <SearchableCombobox
              id="bankName"
              value={draft.bankName}
              onValueChange={(bankName) => onPatch({ bankName })}
              options={banks.map((bank) => ({ value: String(bank.id), label: bank.name }))}
              placeholder="Selecione o banco"
              searchPlaceholder="Buscar banco..."
              emptyMessage="Nenhum banco encontrado."
              disabled={banks.length === 0}
              aria-invalid={!draft.bankName}
            />
            {banks.length === 0 && (
              <FieldHint valid={false} message="Aguarde o carregamento dos bancos reais." />
            )}
          </FormField>
          <FormField id="agency" label="Agência">
            <Input
              id="agency"
              value={draft.agency}
              onChange={(event) => onPatch({ agency: formatAgency(event.target.value) })}
              placeholder="0001"
              inputMode="numeric"
              maxLength={4}
            />
            {draft.agency && (
              <FieldHint
                valid={onlyDigits(draft.agency).length === 4}
                message={`${onlyDigits(draft.agency).length}/4 dígitos.`}
              />
            )}
          </FormField>
          <FormField id="account" label="Conta">
            <Input
              id="account"
              value={draft.account}
              onChange={(event) => onPatch({ account: formatBankAccount(event.target.value) })}
              placeholder="000000"
              inputMode="numeric"
              maxLength={16}
            />
            {draft.account && (
              <FieldHint
                valid={onlyDigits(draft.account).length >= 5 && onlyDigits(draft.account).length <= 16}
                message={`${onlyDigits(draft.account).length}/16 dígitos. Mínimo de 5.`}
              />
            )}
          </FormField>
          <FormField id="accountDigit" label="Dígito">
            <Input
              id="accountDigit"
              value={draft.accountDigit}
              onChange={(event) => onPatch({ accountDigit: formatAccountDigit(event.target.value) })}
              placeholder="0"
              inputMode="numeric"
              maxLength={1}
            />
            {draft.accountDigit && (
              <FieldHint valid={onlyDigits(draft.accountDigit).length === 1} message="Dígito informado." />
            )}
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <FormField id="pixType" label="Tipo de chave Pix">
            <Select value={draft.pixType} onValueChange={(pixType) => onPatch({ pixType, pixKey: "" })}>
              <SelectTrigger id="pixType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIX_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="pixKey" label="Chave Pix visual" hint="Não use Pix real neste ciclo.">
            <Input
              id="pixKey"
              value={draft.pixKey}
              onChange={(event) =>
                onPatch({ pixKey: formatPixDraftValue(draft.pixType, event.target.value) })
              }
              placeholder="chave-sintetica@example.test"
            />
            {draft.pixKey.trim() && (
              <FieldHint
                valid={isValidPix(draft.pixType, draft.pixKey)}
                message={
                  isValidPix(draft.pixType, draft.pixKey)
                    ? `Chave válida para ${PIX_TYPES.find((type) => type.value === draft.pixType)?.label}.`
                    : "Revise o formato da chave Pix para o tipo selecionado."
                }
              />
            )}
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onPatch({ privacy: "public", allowedCpfs: "" })}
            className={cn(
              "rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              draft.privacy === "public" && "border-primary bg-primary/5",
            )}
          >
            <p className="font-semibold text-foreground">Oferta pública</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Estrutura visual aberta, sem lista restrita de documentos.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onPatch({ privacy: "private" })}
            className={cn(
              "rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              draft.privacy === "private" && "border-primary bg-primary/5",
            )}
          >
            <p className="font-semibold text-foreground">Oferta privada</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Permite lista visual de CPFs sintéticos/autorizados, sem validação real.
            </p>
          </button>
        </div>

        {draft.privacy === "private" && (
          <FormField
            id="allowedCpfs"
            label="CPFs permitidos"
            hint="Use apenas CPFs sintéticos ou autorizados. Não há consulta nem envio."
          >
            <Textarea
              id="allowedCpfs"
              value={draft.allowedCpfs}
              onChange={(event) => onPatch({ allowedCpfs: formatAllowedCpfList(event.target.value) })}
              placeholder="000.000.000-00, 111.111.111-11"
            />
          </FormField>
        )}

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Sem transação financeira</AlertTitle>
          <AlertDescription>
            Os campos desta etapa são rascunho visual. Não há geração de Pix, QR Code, cobrança ou
            pagamento.
          </AlertDescription>
        </Alert>

        <StepActions
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continuar para card"
        />
      </CardContent>
    </Card>
  );
}

function MediaStep({
  draft,
  onPatch,
  canContinue,
  onBack,
  onContinue,
}: {
  draft: CampaignDraft;
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [extraUploadError, setExtraUploadError] = useState<string | null>(null);
  const extraImageInputRef = useRef<HTMLInputElement | null>(null);
  const heroPreviewUrl = useMemo(
    () => (draft.heroImageFile ? URL.createObjectURL(draft.heroImageFile) : undefined),
    [draft.heroImageFile],
  );
  const extraPreviewUrls = useMemo(
    () =>
      draft.extraImageFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [draft.extraImageFiles],
  );
  const mediaPendingItems = getMediaPendingItems(draft);
  const cardTitleLength = draft.cardTitle.trim().length;
  const cardTitleValid = fieldHasText(draft.cardTitle, CARD_TITLE_MIN_LENGTH);

  useEffect(() => {
    return () => {
      if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
    };
  }, [heroPreviewUrl]);

  useEffect(() => {
    return () => {
      extraPreviewUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [extraPreviewUrls]);

  const handleHeroImageFile = (file: File | undefined) => {
    if (!file) return;

    const result = validateImage(file);

    if (!result.file) {
      const message = result.error || "Não foi possível usar esta imagem.";
      setHeroUploadError(message);
      toast.error(message);
      return;
    }

    setHeroUploadError(null);
    onPatch({ heroImageFile: result.file });
  };

  const handleExtraImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    const accepted: File[] = [];
    const errors: string[] = [];

    for (const file of files.slice(0, 3)) {
      const result = validateImage(file);

      if (!result.file) {
        errors.push(`${file.name}: ${result.error}`);
        continue;
      }

      accepted.push(result.file);
    }

    if (files.length > 3) {
      errors.push("Selecione no máximo 3 imagens extras por vez.");
    }

    setExtraUploadError(errors[0] || null);

    if (errors.length > 0) {
      toast.error(errors[0]);
    }

    if (accepted.length > 0) {
      onPatch({ extraImageFiles: accepted });
    }
  };

  const removeExtraImage = (fileName: string) => {
    setExtraUploadError(null);
    onPatch({
      extraImageFiles: draft.extraImageFiles.filter((file) => file.name !== fileName),
    });
  };

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 7
        </Badge>
        <CardTitle>Card, textos e mídia</CardTitle>
        <CardDescription>
          Monte a apresentação da campanha. A imagem principal será enviada antes da criação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="cardTitle" label="Título do card">
            <div className="space-y-1.5">
              <Input
                id="cardTitle"
                value={draft.cardTitle}
                onChange={(event) => onPatch({ cardTitle: event.target.value })}
                placeholder="Título comercial da campanha"
                aria-invalid={!cardTitleValid}
                className={cn(
                  !cardTitleValid &&
                    "border-destructive focus-visible:ring-destructive/40",
                )}
              />
              <FieldHint
                valid={cardTitleValid}
                message={`${cardTitleLength}/${CARD_TITLE_MIN_LENGTH} caracteres mínimos · ${
                  cardTitleValid ? "mínimo atingido" : "mínimo pendente"
                }`}
              />
              {!cardTitleValid && (
                <p className="text-xs leading-relaxed text-destructive">
                  Informe um título com pelo menos {CARD_TITLE_MIN_LENGTH} caracteres.
                </p>
              )}
            </div>
          </FormField>

          <FormField
            id="heroImageNote"
            label="Descrição da imagem principal"
            hint="A descrição ajuda na revisão visual; o arquivo abaixo será enviado para gerar image_id."
          >
            <Input
              id="heroImageNote"
              value={draft.heroImageNote}
              onChange={(event) => onPatch({ heroImageNote: event.target.value })}
              placeholder="Ex.: fachada, produto, operação"
            />
          </FormField>
        </div>

        <FormField
          id="heroImageFile"
          label="Arquivo da imagem principal"
          hint="Obrigatório para criar a oportunidade. PNG/JPG até 2 MB; extensão final normalizada para lowercase."
        >
          <FileUploadCard
            id="heroImageFile"
            accept={getUploadAccept(IMAGE_EXTENSIONS)}
            title="Selecionar imagem principal"
            description="PNG, JPG ou JPEG até 2 MB. A imagem só é enviada no envio final."
            file={draft.heroImageFile}
            previewUrl={heroPreviewUrl}
            imageAlt="Prévia da imagem principal da campanha"
            error={heroUploadError}
            status="Imagem pronta para o envio final"
            onFile={handleHeroImageFile}
            onRemove={() => {
              setHeroUploadError(null);
              onPatch({ heroImageFile: null });
            }}
          />
          {!draft.heroImageFile && !heroUploadError && (
            <FieldHint valid={false} message="Imagem principal obrigatória para criar." />
          )}
        </FormField>

        <FormField
          id="cardSubtitle"
          label="Texto curto do card"
          hint={getCharacterHint(draft.cardSubtitle, CARD_SUBTITLE_MIN_LENGTH)}
        >
          <Input
            id="cardSubtitle"
            value={draft.cardSubtitle}
            onChange={(event) => onPatch({ cardSubtitle: event.target.value })}
            placeholder="Resumo para listagem e card."
          />
        </FormField>

        <FormField
          id="cardLongText"
          label="Texto longo da campanha"
          hint={getCharacterHint(draft.cardLongText, CARD_LONG_TEXT_MIN_LENGTH)}
        >
          <Textarea
            id="cardLongText"
            value={draft.cardLongText}
            onChange={(event) => onPatch({ cardLongText: event.target.value })}
            placeholder="Texto de apresentação para investidores, riscos, contexto e uso dos recursos."
            className="min-h-32"
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            id="galleryNotes"
            label="Observações das imagens extras"
            hint="Opcional. Até três arquivos extras podem ser enviados abaixo."
          >
            <Textarea
              id="galleryNotes"
              value={draft.galleryNotes}
              onChange={(event) => onPatch({ galleryNotes: event.target.value })}
              placeholder="Ex.: operação, equipe, documentos, localização."
            />
          </FormField>

          <FormField
            id="extraImageFiles"
            label="Imagens extras"
            hint="Opcional. PNG/JPG até 2 MB cada."
          >
            <Input
              ref={extraImageInputRef}
              id="extraImageFiles"
              type="file"
              accept={`${getUploadAccept(IMAGE_EXTENSIONS)},image/jpeg,image/png`}
              multiple
              onChange={handleExtraImages}
              className="sr-only"
              aria-describedby="extraImageFilesHelp"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => extraImageInputRef.current?.click()}
              aria-describedby="extraImageFilesHelp"
              className={cn(
                "flex h-auto w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm font-medium text-foreground transition-colors hover:border-primary/70",
                extraUploadError && "border-destructive/70 bg-destructive/5",
              )}
            >
              <Image className="mb-2 h-5 w-5 text-primary" />
              <span>Selecionar imagens extras</span>
              <span id="extraImageFilesHelp" className="mt-1 text-xs font-normal text-muted-foreground">
                Até 3 imagens, PNG/JPG/JPEG, 2 MB cada. Selecionar novamente substitui a lista.
              </span>
            </Button>
            {extraUploadError && (
              <p className="text-xs leading-relaxed text-destructive">{extraUploadError}</p>
            )}
            {extraPreviewUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {extraPreviewUrls.length} imagem(ns) extra(s) pronta(s) para envio.
                </p>
                {extraPreviewUrls.map((item) => (
                  <SelectedFileCard
                    key={`${item.file.name}-${item.file.lastModified}`}
                    file={item.file}
                    previewUrl={item.url}
                    imageAlt="Prévia de imagem extra da campanha"
                    status="Imagem extra pronta para o envio final"
                    onRemove={() => removeExtraImage(item.file.name)}
                  />
                ))}
              </div>
            )}
          </FormField>

          <FormField id="extraVideoUrl" label="Vídeo complementar">
            <Input
              id="extraVideoUrl"
              value={draft.extraVideoUrl}
              onChange={(event) => onPatch({ extraVideoUrl: event.target.value })}
              placeholder="https://..."
            />
            {draft.extraVideoUrl.trim() && (
              <FieldHint
                valid={isValidOptionalUrl(draft.extraVideoUrl)}
                message={
                  isValidOptionalUrl(draft.extraVideoUrl)
                    ? "URL de vídeo complementar válida."
                    : "Informe uma URL completa ou deixe o campo vazio."
                }
              />
            )}
          </FormField>
        </div>

        {!canContinue && (
          <Alert>
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Card e mídia incompletos</AlertTitle>
            <AlertDescription>
              <p>Resolva as pendências abaixo antes de seguir para a revisão:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {mediaPendingItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <StepActions
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continuar para revisão"
        />
      </CardContent>
    </Card>
  );
}

function ReviewStep({
  draft,
  segments,
  banks,
  onPatch,
  canFinish,
  onBack,
  onSubmit,
  submitting,
  createdOpportunityId,
  submitError,
  onSelectSubmitError,
}: {
  draft: CampaignDraft;
  segments: ReferenceOption[];
  banks: ReferenceOption[];
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canFinish: boolean;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  createdOpportunityId: number | null;
  submitError: SubmitErrorState;
  onSelectSubmitError: (item: SubmitErrorItem) => void;
}) {
  const quotaCount = getQuotaCount(draft.targetAmount, draft.shareValue);
  const heroPreviewUrl = useMemo(
    () => (draft.heroImageFile ? URL.createObjectURL(draft.heroImageFile) : undefined),
    [draft.heroImageFile],
  );

  useEffect(() => {
    return () => {
      if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
    };
  }, [heroPreviewUrl]);

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 8
        </Badge>
        <CardTitle>Revisão final visual</CardTitle>
        <CardDescription>
          Confirme o rascunho. Esta etapa cria uma oportunidade persistente no backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Ação persistente</AlertTitle>
          <AlertDescription>
            Ao confirmar, o frontend enviará imagens e criará uma oportunidade real para a conta QA
            autenticada. Não use dados reais de cliente neste teste.
          </AlertDescription>
        </Alert>

        {createdOpportunityId && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Oportunidade criada</AlertTitle>
            <AlertDescription>
              O backend retornou o identificador {createdOpportunityId}. Revise a listagem de
              campanhas para acompanhar o status.
            </AlertDescription>
          </Alert>
        )}

        <SubmitErrorAlert submitError={submitError} onSelectItem={onSelectSubmitError} />

        <CampaignPublishedPreview
          imageUrl={heroPreviewUrl}
          title={draft.cardTitle}
          shortText={draft.cardSubtitle || draft.shortDescription}
          segment={getOptionName(segments, draft.segment)}
          modality={draft.modality ? modalityLabel[draft.modality] : "Modalidade pendente"}
          target={formatCurrency(toPositiveNumber(draft.targetAmount))}
          location={`${draft.city || "Cidade"} / ${draft.state || "UF"}`}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard title="Identificação" icon={Building2}>
            <SummaryItem label="Nome" value={draft.opportunityName || "Não informado"} />
            <SummaryItem
              label="Modalidade"
              value={draft.modality ? modalityLabel[draft.modality] : "-"}
            />
            <SummaryItem label="Segmento" value={getOptionName(segments, draft.segment)} />
          </SummaryCard>

          <SummaryCard title="Financeiro" icon={Landmark}>
            <SummaryItem
              label="Meta"
              value={formatCurrency(toPositiveNumber(draft.targetAmount))}
            />
            <SummaryItem
              label="Valor por cota"
              value={formatCurrency(toPositiveNumber(draft.shareValue))}
            />
            <SummaryItem label="Cotas visuais" value={quotaCount.toLocaleString("pt-BR")} />
            {draft.modality === "debt" && (
              <SummaryItem
                label="Dívida"
                value={`${draft.profitability || "-"}% | ${draft.installments || "-"} parcelas | ${
                  draft.paymentFrequency || "-"
                }`}
              />
            )}
            {draft.modality === "equity" && (
              <SummaryItem label="Participação" value={`${draft.equityPercentage || "-"}%`} />
            )}
          </SummaryCard>

          <SummaryCard title="Operação" icon={MapPin}>
            <SummaryItem label="Cidade/UF" value={`${draft.city || "-"} / ${draft.state || "-"}`} />
            <SummaryItem
              label="Endereço"
              value={`${draft.street || "-"}, ${draft.number || "-"}`}
            />
            <SummaryItem
              label="Equipe"
              value={fieldHasText(draft.teamMembers) ? "Informada" : "Pendente"}
            />
          </SummaryCard>

          <SummaryCard title="Conta e exposição" icon={CreditCard}>
            <SummaryItem label="Banco" value={getOptionName(banks, draft.bankName)} />
            <SummaryItem
              label="Pix visual"
              value={fieldHasText(draft.pixKey) ? "Informado" : "Pendente"}
            />
            <SummaryItem
              label="Privacidade"
              value={draft.privacy === "public" ? "Oferta pública" : "Oferta privada"}
            />
          </SummaryCard>

          <SummaryCard title="Card" icon={Video}>
            <SummaryItem label="Título" value={draft.cardTitle || "Não informado"} />
            <SummaryItem label="Texto curto" value={draft.cardSubtitle || "Não informado"} />
            <SummaryItem
              label="Mídia"
              value={draft.heroImageFile ? getImageFileSummary(draft.heroImageFile) : "Pendente"}
            />
          </SummaryCard>
        </div>

        <button
          type="button"
          onClick={() => onPatch({ safeReviewAccepted: !draft.safeReviewAccepted })}
          className={cn(
            "flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            draft.safeReviewAccepted && "border-primary bg-primary/5",
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
              draft.safeReviewAccepted
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background",
            )}
          >
            {draft.safeReviewAccepted && <CheckCircle2 className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Confirmo que quero criar esta oportunidade
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Entendo que esta ação envia imagens e cria um registro persistente no backend para a
              conta QA autenticada.
            </p>
          </div>
        </button>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-sm text-muted-foreground">
              {canFinish
                ? "Pronto para criar oportunidade persistente."
                : "Confirme a ação persistente para liberar o envio."}
            </p>
            <Button type="button" onClick={onSubmit} disabled={!canFinish || submitting || !!createdOpportunityId}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar oportunidade"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignPublishedPreview({
  imageUrl,
  title,
  shortText,
  segment,
  modality,
  target,
  location,
}: {
  imageUrl?: string;
  title: string;
  shortText: string;
  segment: string;
  modality: string;
  target: string;
  location: string;
}) {
  const displayTitle = title.trim() || "Título do card";
  const displayShortText = shortText.trim() || "Texto curto da campanha";

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">Pré-visualização da campanha</h3>
        <p className="text-sm text-muted-foreground">
          Confira o enquadramento da imagem principal e o texto que aparece no card antes do envio.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <div className="relative aspect-video overflow-hidden bg-muted md:aspect-[16/7]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Prévia da campanha ${displayTitle}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Image className="h-8 w-8" />
              <span className="text-sm font-medium">Imagem principal ainda não selecionada</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                Como será exibida
              </p>
              <p className="truncate text-xl font-bold text-white">{displayTitle}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 bg-background/90 text-foreground">
              {modality}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold leading-tight text-foreground">{displayTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {displayShortText}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {segment}
            </Badge>
          </div>

          <div className="grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-3">
            <span>Meta visual: {target}</span>
            <span>Local: {location}</span>
            <span>Imagem: corte central com object-cover</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="font-semibold text-foreground">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-64 text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function CampaignCreatePage() {
  const readiness = useCampaignReadiness();
  const blockingPrerequisites = useMemo(
    () => getBlockingPrerequisites(readiness.items),
    [readiness.items],
  );
  const canStart = !readiness.loading && blockingPrerequisites.length === 0;
  const hasBlockingContract = blockingPrerequisites.some((item) => item.status === "blocked");
  const [previewWizard, setPreviewWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("modality");
  const [draft, setDraft] = useState<CampaignDraft>(INITIAL_DRAFT);
  const [segments, setSegments] = useState<ReferenceOption[]>([]);
  const [banks, setBanks] = useState<ReferenceOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [warranties, setWarranties] = useState<ReferenceOption[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdOpportunityId, setCreatedOpportunityId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<SubmitErrorState>(null);
  const validation = useMemo(
    () => getDraftValidation(draft, segments, banks, countries),
    [banks, countries, draft, segments],
  );
  const showWizard = canStart || previewWizard;

  useEffect(() => {
    let active = true;

    async function loadReferences() {
      const [segmentsResult, banksResult, countriesResult, warrantiesResult] = await Promise.allSettled([
        getSegments(),
        getBanks(),
        getCountries(),
        getWarranties(),
      ]);

      if (!active) return;

      if (segmentsResult.status === "fulfilled") {
        setSegments(getDataArray(segmentsResult.value));
      }

      if (banksResult.status === "fulfilled") {
        setBanks(getDataArray(banksResult.value));
      }

      if (countriesResult.status === "fulfilled") {
        const nextCountries = getDataArray<CountryOption>(countriesResult.value);
        setCountries(nextCountries);
        setDraft((current) => ({
          ...current,
          countryId: getCountryValueForNewDraft(nextCountries, current.countryId),
        }));
      }

      if (warrantiesResult.status === "fulfilled") {
        setWarranties(getDataArray(warrantiesResult.value));
      }

      if (
        segmentsResult.status === "rejected" ||
        banksResult.status === "rejected" ||
        countriesResult.status === "rejected" ||
        warrantiesResult.status === "rejected"
      ) {
        toast.error("Não foi possível carregar todos os cadastros auxiliares.");
      }

      setReferencesLoading(false);
    }

    loadReferences();

    return () => {
      active = false;
    };
  }, []);

  const patchDraft = useCallback((patch: Partial<CampaignDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSubmitError(null);
  }, []);

  const resetPreview = () => {
    setPreviewWizard(false);
    setCurrentStep("modality");
    setDraft({ ...INITIAL_DRAFT, countryId: getCountryValueForReset(countries) });
  };

  const goToStep = (step: WizardStep) => {
    if (!canEnterWizardStep(step, validation)) {
      const blockingStep = getBlockingStepFor(step, validation);

      if (blockingStep) {
        setCurrentStep(blockingStep);
        toast.error(STEP_BLOCKING_MESSAGES[blockingStep]);
      }

      return;
    }

    setCurrentStep(step);
  };

  const goToNextStep = () => {
    const index = getStepIndex(currentStep);
    const next = WIZARD_STEPS[index + 1];
    if (next) goToStep(next.id);
  };

  const goToPreviousStep = () => {
    const index = getStepIndex(currentStep);
    const previous = WIZARD_STEPS[index - 1];
    if (previous) setCurrentStep(previous.id);
  };

  const focusField = (focusId?: string) => {
    if (!focusId) return;

    window.setTimeout(() => {
      const field = document.getElementById(focusId);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus({ preventScroll: true });
    }, 100);
  };

  const handleSubmitErrorItem = (item: SubmitErrorItem) => {
    setCurrentStep(item.step);
    focusField(item.focusId);
  };

  const handleTextPatch =
    (field: keyof CampaignDraft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      patchDraft({ [field]: event.target.value } as Partial<CampaignDraft>);

  const handleSubmit = async () => {
    const firstInvalidStep = getFirstInvalidRequiredStep(validation);

    if (firstInvalidStep) {
      setCurrentStep(firstInvalidStep);
      toast.error(STEP_BLOCKING_MESSAGES[firstInvalidStep]);
      return;
    }

    if (!validation.review) {
      toast.error("Confirme a ação persistente antes de enviar.");
      return;
    }

    if (!draft.heroImageFile) {
      toast.error("Envie a imagem principal antes de criar a oportunidade.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const imageId = await uploadCampaignImage(draft.heroImageFile, "opportunities/banner");
      const extraImageIds: number[] = [];

      for (const image of draft.extraImageFiles.slice(0, 3)) {
        extraImageIds.push(await uploadCampaignImage(image, "opportunities/extra_images"));
      }

      const warrantyIds = draft.warrantyId ? [Number(draft.warrantyId)] : [];
      const selectedCountry =
        countries.find((country) => String(country.id) === draft.countryId) ?? null;
      const brazilSelected = isBrazilCountry(selectedCountry);
      const payload = {
        is_private: draft.privacy === "private",
        modality: draft.modality,
        warranty: warrantyIds.length > 0,
        address: {
          country_id: toNumericPayloadId(draft.countryId),
          city: draft.city.trim(),
          complement: null,
          district: draft.district.trim(),
          number: draft.number.trim(),
          state: normalizeSubdivisionForPayload(selectedCountry, draft.state),
          street_name: draft.street.trim(),
          zip_code: brazilSelected ? onlyDigits(draft.zipCode) : draft.zipCode.trim(),
        },
        members: [],
        monetary: {
          max_goal: toPositiveNumber(draft.targetAmount),
          min_investment_value: toPositiveNumber(draft.shareValue),
          warranty_amount: 0,
        },
        opportunity: {
          image_id: imageId,
          segment_id: Number(draft.segment),
          about: draft.cardLongText.trim() || draft.longDescription.trim(),
          business_name: draft.cardTitle.trim() || draft.opportunityName.trim(),
          company_cnpj: onlyDigits(draft.documentNumber),
          cpf: onlyDigits(draft.responsibleCpf),
          whatsapp_group: draft.whatsapp.trim(),
          promotional_video_url: draft.videoUrl.trim() || draft.extraVideoUrl.trim() || null,
          description: draft.shortDescription.trim(),
          name: draft.opportunityName.trim(),
          resource_utilization: draft.resourceUtilization,
          spe_cnpj: onlyDigits(draft.speCnpj),
        },
        ...(draft.modality === "debt"
          ? {
              debt: {
                percentage_profitability: toPositiveNumber(draft.profitability),
                payment_frequency: draft.paymentFrequency,
                grace_period: 0,
                total_installments: toInteger(draft.installments),
                single_installment: draft.paymentFrequency === "unica",
              },
            }
          : {
              equity: {
                participation: toPositiveNumber(draft.equityPercentage),
              },
            }),
        warranties: warrantyIds,
        bank_account: {
          bank_id: toNumericPayloadId(draft.bankName),
          agency: onlyDigits(draft.agency),
          account: onlyDigits(draft.account),
          account_digit: onlyDigits(draft.accountDigit),
        },
        pix: {
          type: draft.pixType,
          key: normalizePixKey(draft.pixType, draft.pixKey),
        },
        allowed_cpfs:
          draft.privacy === "private"
            ? draft.allowedCpfs
                .split(/[,\n;]/)
                .map((value) => onlyDigits(value))
                .filter(Boolean)
            : null,
        extra_images: extraImageIds,
      };

      const response = await createOpportunity(payload);
      const id = Number(getResponseData(response)?.id);

      if (Number.isFinite(id) && id > 0) {
        setCreatedOpportunityId(id);
      }

      toast.success("Oportunidade criada com sucesso.");
    } catch (error) {
      const normalizedError = normalizeSubmitError(error);

      setSubmitError(normalizedError);

      if (normalizedError.items?.length) {
        toast.error("Não foi possível criar a oportunidade. Revise os campos indicados.");
      } else {
        if (normalizedError.step) setCurrentStep(normalizedError.step);
        toast.error(normalizedError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Button variant="ghost" asChild className="w-fit px-0 text-muted-foreground">
            <Link to="/app/campanhas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para campanhas
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Issue #9</Badge>
              <Badge variant="outline">Fluxo completo local</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Nova campanha</h1>
            <p className="max-w-3xl text-muted-foreground">
              Wizard completo de oportunidade com validações locais, upload de imagens e criação
              persistente somente no envio final.
            </p>
          </div>
        </div>

        <CampaignCreationStatusCard readiness={readiness} />
      </div>

      {!canStart && (
        <Alert variant={hasBlockingContract ? "destructive" : "default"}>
          <LockKeyhole className="h-4 w-4" />
          <AlertTitle>Campanha ainda não liberada</AlertTitle>
          <AlertDescription>
            Resolva os itens pendentes antes de iniciar uma criação real. A estrutura abaixo pode
            ser visualizada de forma segura, sem enviar dados ao backend.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CircleAlert className="h-5 w-5 text-primary" />
              Pré-requisitos
            </CardTitle>
            <CardDescription>
              A criação real permanece bloqueada apenas quando houver pendências de perfil pessoal
              ou endereço da empresa.
            </CardDescription>
          </div>
          {!canStart && !previewWizard && (
            <Button type="button" variant="outline" onClick={() => setPreviewWizard(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar estrutura do wizard
            </Button>
          )}
          {!canStart && previewWizard && (
            <Button type="button" variant="outline" onClick={resetPreview}>
              Ocultar prévia
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <CampaignPrerequisiteList items={readiness.items} loading={readiness.loading} />
        </CardContent>
      </Card>

      {showWizard && (
        <section className="space-y-5">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>
              {canStart ? "Wizard liberado visualmente" : "Prévia visual sem envio"}
            </AlertTitle>
            <AlertDescription>
              Não há autosave nem rascunho. Fechar a página descarta os dados locais. A criação
              persistente acontece apenas no botão final de revisão.
            </AlertDescription>
          </Alert>

          <CampaignWizardProgress
            currentStep={currentStep}
            validation={validation}
            submitError={submitError}
          />

          {currentStep !== "review" && (
            <SubmitErrorAlert submitError={submitError} onSelectItem={handleSubmitErrorItem} />
          )}

          {currentStep === "modality" && (
            <ModalityStep draft={draft} onPatch={patchDraft} onContinue={goToNextStep} />
          )}

          {currentStep === "basics" && (
            <BasicsStep
              draft={draft}
              segments={segments}
              referencesLoading={referencesLoading}
              onPatch={patchDraft}
              canContinue={validation.basics}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
              submitError={submitError}
            />
          )}

          {currentStep === "financial" && (
            <FinancialStep
              draft={draft}
              onPatch={patchDraft}
              canContinue={validation.financial}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
            />
          )}

          {currentStep === "target" && (
            <TargetStep
              draft={draft}
              onPatch={patchDraft}
              canContinue={validation.target}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
            />
          )}

          {currentStep === "operations" && (
            <OperationsStep
              draft={draft}
              warranties={warranties}
              countries={countries}
              onPatch={patchDraft}
              canContinue={validation.operations}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
            />
          )}

          {currentStep === "banking" && (
            <BankingStep
              draft={draft}
              banks={banks}
              onPatch={patchDraft}
              canContinue={validation.banking}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
            />
          )}

          {currentStep === "media" && (
            <MediaStep
              draft={draft}
              onPatch={patchDraft}
              canContinue={validation.media}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
            />
          )}

          {currentStep === "review" && (
            <ReviewStep
              draft={draft}
              segments={segments}
              banks={banks}
              onPatch={patchDraft}
              canFinish={validation.review}
              onBack={goToPreviousStep}
              onSubmit={handleSubmit}
              submitting={submitting}
              createdOpportunityId={createdOpportunityId}
              submitError={submitError}
              onSelectSubmitError={handleSubmitErrorItem}
            />
          )}

          <Separator />
          <div className="flex flex-wrap gap-2">
            {WIZARD_STEPS.map((step, index) => (
              <Button
                key={step.id}
                type="button"
                variant={step.id === currentStep ? "default" : "outline"}
                size="sm"
                onClick={() => goToStep(step.id)}
                title={
                  canEnterWizardStep(step.id, validation)
                    ? undefined
                    : "Há etapas anteriores pendentes."
                }
                className={cn(
                  !canEnterWizardStep(step.id, validation) &&
                    "border-dashed text-muted-foreground hover:text-muted-foreground",
                )}
              >
                {step.label}
                {!canEnterWizardStep(step.id, validation) && index > 0 ? " · pendente" : ""}
              </Button>
            ))}
          </div>
        </section>
      )}

      {!showWizard && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              Estrutura do wizard protegida
            </CardTitle>
            <CardDescription>
              A próxima etapa visual fica disponível pela prévia segura ou quando os pré-requisitos
              forem atendidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {WIZARD_STEPS.map((step) => (
                <div key={step.id} className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
