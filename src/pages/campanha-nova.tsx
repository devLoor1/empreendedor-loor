import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
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
import { cn } from "@/lib/utils";
import { getBlockingPrerequisites, useCampaignReadiness } from "@/hooks/use-campaign-readiness";

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

type CampaignDraft = {
  modality: CampaignModality | null;
  opportunityName: string;
  documentType: DocumentType;
  documentNumber: string;
  segment: string;
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
  zipCode: string;
  state: string;
  city: string;
  district: string;
  street: string;
  number: string;
  bankName: string;
  agency: string;
  account: string;
  pixType: string;
  pixKey: string;
  privacy: PrivacyMode;
  allowedCpfs: string;
  cardTitle: string;
  cardSubtitle: string;
  cardLongText: string;
  heroImageNote: string;
  galleryNotes: string;
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
  documentType: "cnpj",
  documentNumber: "",
  segment: "",
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
  zipCode: "",
  state: "",
  city: "",
  district: "",
  street: "",
  number: "",
  bankName: "",
  agency: "",
  account: "",
  pixType: "cpf",
  pixKey: "",
  privacy: "public",
  allowedCpfs: "",
  cardTitle: "",
  cardSubtitle: "",
  cardLongText: "",
  heroImageNote: "",
  galleryNotes: "",
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

const SEGMENT_OPTIONS = [
  "Agronegócio",
  "Energia",
  "Imobiliário",
  "Tecnologia",
  "Saúde",
  "Varejo",
  "Serviços",
  "Outro",
];

const FREQUENCY_OPTIONS = [
  "Mensal",
  "Bimestral",
  "Trimestral",
  "Semestral",
  "Anual",
  "No vencimento",
];

const PIX_TYPES = ["CPF", "CNPJ", "Telefone", "E-mail", "Chave aleatória"];

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

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function fieldHasText(value: string, minLength = 1) {
  return value.trim().length >= minLength;
}

function toPositiveNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0);
}

function formatDocument(value: string, type: DocumentType) {
  const digits = onlyDigits(value).slice(0, type === "cnpj" ? 14 : 11);

  if (type === "cpf") {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function formatZipCode(value: string) {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidDocument(value: string, type: DocumentType) {
  return onlyDigits(value).length === (type === "cnpj" ? 14 : 11);
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

function getDraftValidation(draft: CampaignDraft) {
  const basicsValid =
    fieldHasText(draft.opportunityName, 3) &&
    isValidDocument(draft.documentNumber, draft.documentType) &&
    fieldHasText(draft.segment) &&
    fieldHasText(draft.shortDescription, 20) &&
    fieldHasText(draft.longDescription, 80);

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
    toPositiveNumber(draft.targetAmount) > 0 &&
    toPositiveNumber(draft.shareValue) > 0 &&
    getQuotaCount(draft.targetAmount, draft.shareValue) > 0;

  const operationsValid =
    fieldHasText(draft.teamMembers, 10) &&
    fieldHasText(draft.zipCode, 9) &&
    fieldHasText(draft.state, 2) &&
    fieldHasText(draft.city, 2) &&
    fieldHasText(draft.street, 3) &&
    fieldHasText(draft.number);

  const bankingValid =
    fieldHasText(draft.bankName, 2) &&
    fieldHasText(draft.agency, 2) &&
    fieldHasText(draft.account, 2) &&
    fieldHasText(draft.pixKey, 4) &&
    (draft.privacy === "public" || fieldHasText(draft.allowedCpfs, 11));

  const mediaValid =
    fieldHasText(draft.cardTitle, 5) &&
    fieldHasText(draft.cardSubtitle, 20) &&
    fieldHasText(draft.cardLongText, 80);

  return {
    modality: draft.modality !== null,
    basics: basicsValid,
    financial: debtValid || equityValid,
    target: targetValid,
    operations: operationsValid,
    banking: bankingValid,
    media: mediaValid,
    review: draft.safeReviewAccepted,
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

function CampaignWizardProgress({ currentStep }: { currentStep: WizardStep }) {
  const activeIndex = getStepIndex(currentStep);

  return (
    <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
      {WIZARD_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isDone = index < activeIndex;
        const isFuture = index > activeIndex;

        return (
          <div
            key={step.id}
            className={cn(
              "flex min-h-28 flex-col gap-3 rounded-lg border p-3 transition-colors",
              isActive && "border-primary bg-primary/5",
              isDone && "border-emerald-200 bg-emerald-50 text-emerald-900",
              isFuture && "border-border bg-card text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                isActive && "border-primary bg-primary text-primary-foreground",
                isDone && "border-emerald-500 bg-emerald-500 text-white",
                isFuture && "border-border bg-background text-muted-foreground",
              )}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{step.label}</p>
              <p className="text-xs leading-relaxed">{step.description}</p>
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
          <Badge variant="outline">Sem envio</Badge>
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
  const handleDocumentTypeChange = (type: DocumentType) => {
    onPatch({
      documentType: type,
      documentNumber: formatDocument(draft.documentNumber, type),
    });
  };

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 2
        </Badge>
        <CardTitle>Dados básicos da oportunidade</CardTitle>
        <CardDescription>
          Estruture os dados visuais principais. Nada será salvo neste ciclo.
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
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENT_OPTIONS.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <FormField id="documentType" label="Documento visual">
            <Select value={draft.documentType} onValueChange={handleDocumentTypeChange}>
              <SelectTrigger id="documentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            id="documentNumber"
            label={draft.documentType === "cnpj" ? "CNPJ" : "CPF"}
            hint="Use apenas dado sintético ou autorizado. A validação é visual por quantidade de dígitos."
          >
            <Input
              id="documentNumber"
              value={draft.documentNumber}
              onChange={(event) =>
                onPatch({
                  documentNumber: formatDocument(event.target.value, draft.documentType),
                })
              }
              placeholder={draft.documentType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
            />
          </FormField>
        </div>

        <FormField
          id="shortDescription"
          label="Descrição curta"
          hint="Mínimo visual: 20 caracteres."
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
          hint="Mínimo visual: 80 caracteres."
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
          </FormField>

          <FormField
            id="whatsapp"
            label="WhatsApp opcional"
            hint="Campo visual, não dispara contato."
          >
            <Input
              id="whatsapp"
              value={draft.whatsapp}
              onChange={(event) => onPatch({ whatsapp: formatPhone(event.target.value) })}
              placeholder="(00) 00000-0000"
            />
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
          Os campos mudam conforme a modalidade escolhida, ainda sem contrato de envio.
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
                onChange={(event) => onPatch({ profitability: event.target.value })}
                placeholder="Ex.: 14,5"
              />
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
                    <SelectItem key={frequency} value={frequency}>
                      {frequency}
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
              onChange={(event) => onPatch({ equityPercentage: event.target.value })}
              placeholder="Ex.: 12,5"
            />
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
              onChange={(event) => onPatch({ targetAmount: event.target.value })}
              placeholder="Ex.: 500000"
            />
          </FormField>

          <FormField id="shareValue" label="Valor por cota">
            <Input
              id="shareValue"
              inputMode="decimal"
              value={draft.shareValue}
              onChange={(event) => onPatch({ shareValue: event.target.value })}
              placeholder="Ex.: 1000"
            />
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

        <div className="grid gap-4 md:grid-cols-4">
          <FormField id="zipCode" label="CEP">
            <Input
              id="zipCode"
              value={draft.zipCode}
              onChange={(event) => onPatch({ zipCode: formatZipCode(event.target.value) })}
              placeholder="00000-000"
            />
          </FormField>
          <FormField id="state" label="UF">
            <Input
              id="state"
              value={draft.state}
              onChange={(event) => onPatch({ state: event.target.value.toUpperCase().slice(0, 2) })}
              placeholder="SP"
            />
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
        <Badge variant="secondary" className="w-fit">
          Etapa 6
        </Badge>
        <CardTitle>Conta bancária, Pix e privacidade</CardTitle>
        <CardDescription>
          Campos visuais para compor o fluxo. Nenhum Pix, pagamento ou QR Code será criado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="bankName" label="Banco">
            <Input
              id="bankName"
              value={draft.bankName}
              onChange={(event) => onPatch({ bankName: event.target.value })}
              placeholder="Banco de teste"
            />
          </FormField>
          <FormField id="agency" label="Agência">
            <Input
              id="agency"
              value={draft.agency}
              onChange={(event) => onPatch({ agency: event.target.value })}
              placeholder="0001"
            />
          </FormField>
          <FormField id="account" label="Conta">
            <Input
              id="account"
              value={draft.account}
              onChange={(event) => onPatch({ account: event.target.value })}
              placeholder="000000-0"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <FormField id="pixType" label="Tipo de chave Pix">
            <Select value={draft.pixType} onValueChange={(pixType) => onPatch({ pixType })}>
              <SelectTrigger id="pixType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIX_TYPES.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="pixKey" label="Chave Pix visual" hint="Não use Pix real neste ciclo.">
            <Input
              id="pixKey"
              value={draft.pixKey}
              onChange={(event) => onPatch({ pixKey: event.target.value })}
              placeholder="chave-sintetica@example.test"
            />
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
              onChange={(event) => onPatch({ allowedCpfs: event.target.value })}
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
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 7
        </Badge>
        <CardTitle>Card, textos e mídia</CardTitle>
        <CardDescription>
          Monte a apresentação visual da campanha sem upload real de arquivos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="cardTitle" label="Título do card">
            <Input
              id="cardTitle"
              value={draft.cardTitle}
              onChange={(event) => onPatch({ cardTitle: event.target.value })}
              placeholder="Título comercial da campanha"
            />
          </FormField>

          <FormField
            id="heroImageNote"
            label="Imagem principal"
            hint="Referência textual, sem upload."
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
          id="cardSubtitle"
          label="Texto curto do card"
          hint="Mínimo visual: 20 caracteres."
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
          hint="Mínimo visual: 80 caracteres."
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
            label="Imagens extras"
            hint="Referências textuais, sem upload."
          >
            <Textarea
              id="galleryNotes"
              value={draft.galleryNotes}
              onChange={(event) => onPatch({ galleryNotes: event.target.value })}
              placeholder="Ex.: operação, equipe, documentos, localização."
            />
          </FormField>

          <FormField id="extraVideoUrl" label="Vídeo complementar">
            <Input
              id="extraVideoUrl"
              value={draft.extraVideoUrl}
              onChange={(event) => onPatch({ extraVideoUrl: event.target.value })}
              placeholder="https://..."
            />
          </FormField>
        </div>

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
  onPatch,
  canFinish,
  onBack,
}: {
  draft: CampaignDraft;
  onPatch: (patch: Partial<CampaignDraft>) => void;
  canFinish: boolean;
  onBack: () => void;
}) {
  const quotaCount = getQuotaCount(draft.targetAmount, draft.shareValue);

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Etapa 8
        </Badge>
        <CardTitle>Revisão final visual</CardTitle>
        <CardDescription>
          Confirme o rascunho local. O envio real permanece desabilitado até validação de contrato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <LockKeyhole className="h-4 w-4" />
          <AlertTitle>Envio real bloqueado</AlertTitle>
          <AlertDescription>
            Esta tela não cria oportunidade. O botão final fica em modo seguro porque a integração
            de persistência e os contratos finais ainda não foram aprovados neste ciclo.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard title="Identificação" icon={Building2}>
            <SummaryItem label="Nome" value={draft.opportunityName || "Não informado"} />
            <SummaryItem
              label="Modalidade"
              value={draft.modality ? modalityLabel[draft.modality] : "-"}
            />
            <SummaryItem label="Segmento" value={draft.segment || "Não informado"} />
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
            <SummaryItem label="Banco" value={draft.bankName || "Não informado"} />
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
              value={draft.heroImageNote || draft.extraVideoUrl ? "Referenciada" : "Opcional"}
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
              Confirmo que esta revisão é apenas visual
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhuma campanha será criada, enviada, aprovada ou publicada por esta tela neste
              ciclo.
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
                ? "Revisão visual confirmada. Envio real permanece bloqueado."
                : "Confirme o modo visual para concluir a revisão local."}
            </p>
            <Button type="button" disabled>
              Solicitar análise bloqueado neste ciclo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
  const validation = useMemo(() => getDraftValidation(draft), [draft]);
  const showWizard = canStart || previewWizard;

  const patchDraft = (patch: Partial<CampaignDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const resetPreview = () => {
    setPreviewWizard(false);
    setCurrentStep("modality");
    setDraft(INITIAL_DRAFT);
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goToNextStep = () => {
    const index = getStepIndex(currentStep);
    const next = WIZARD_STEPS[index + 1];
    if (next) setCurrentStep(next.id);
  };

  const goToPreviousStep = () => {
    const index = getStepIndex(currentStep);
    const previous = WIZARD_STEPS[index - 1];
    if (previous) setCurrentStep(previous.id);
  };

  const handleTextPatch =
    (field: keyof CampaignDraft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      patchDraft({ [field]: event.target.value } as Partial<CampaignDraft>);

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
              Wizard completo de oportunidade em modo seguro, com dados locais, validações visuais e
              envio real bloqueado.
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
              A criação real permanece bloqueada quando houver pendências de perfil, documentos,
              empresa ou contrato.
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
              Este fluxo não cria campanha, não faz upload, não confirma investimento e não executa
              chamadas transacionais. Todos os campos ficam apenas no estado local da tela.
            </AlertDescription>
          </Alert>

          <CampaignWizardProgress currentStep={currentStep} />

          {currentStep === "modality" && (
            <ModalityStep draft={draft} onPatch={patchDraft} onContinue={goToNextStep} />
          )}

          {currentStep === "basics" && (
            <BasicsStep
              draft={draft}
              onPatch={patchDraft}
              canContinue={validation.basics}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
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
              onPatch={patchDraft}
              canContinue={validation.operations}
              onBack={goToPreviousStep}
              onContinue={goToNextStep}
            />
          )}

          {currentStep === "banking" && (
            <BankingStep
              draft={draft}
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
              onPatch={patchDraft}
              canFinish={validation.review}
              onBack={goToPreviousStep}
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
                disabled={index > getStepIndex(currentStep) + 1}
              >
                {step.label}
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
