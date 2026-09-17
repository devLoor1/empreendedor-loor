import { useParams, Link, useNavigate } from "react-router-dom";
import { useCallback, useState, useEffect, useRef, type FormEvent } from "react";
import {
  ArrowLeft, Users, Calendar, TrendingUp, Building2, Shield, ExternalLink,
  Play, PieChart, Banknote, Clock, CheckCircle2, AlertCircle, CircleDollarSign,
  Percent, Timer, CreditCard, FileText, Share2, MessageCircle, Download,
  Loader2, Pencil, Plus, RefreshCw, Trash2, Upload,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteOpportunityDocument,
  downloadOpportunityInvestmentContract,
  getOpportunity,
  getOpportunityDocuments,
  getOpportunityInvestors,
  replaceOpportunityDocument,
  updateOpportunity,
  uploadOpportunityDocument,
} from "@/services/api";
import { formatBRLFromCents } from "@/utils/br-formatters";
import { normalizeUploadFilename } from "@/utils/upload-validation";
import { formatOpportunityDate, parseOpportunityDate } from "@/features/campaign-creation/opportunity-lifecycle";
import { readOpportunityBanking } from "@/features/campaign-creation/opportunity-banking-readback";
import {
  canCreateOpportunityDocument,
  canDeleteOpportunityDocument,
  canReplaceOpportunityDocument,
  OPPORTUNITY_DOCUMENT_WRITE_TYPES,
  opportunityDocumentTypeLabel,
  opportunityDocumentReadbackMatches,
  parseCreatedOpportunityDocumentId,
  parseOpportunityDocuments,
  safeOpportunityDocumentUrl,
  validateOpportunityDocumentFile,
  validateOpportunityDocumentName,
  type OpportunityDocument,
  type OpportunityDocumentReadback,
  type OpportunityDocumentWriteType,
} from "@/features/campaign-documents/opportunity-documents";
import {
  buildOwnerContentPatch,
  canEditOwnerContent,
  ownerContentReadbackMatches,
  toOwnerContentDraft,
  type OwnerContentPatch,
} from "@/features/campaign-edit/owner-content-edit";

// ── Types ────────────────────────────────────────────────────────────────────

type GoalData = {
  confirmed_payment: number;
  confirmed_payment_percentage: number;
  unconfirmed_payment: number;
  max_goal: number;
  min_goal: number;
  percentage_awaiting_payment: number;
};

type MonetaryData = {
  min_investment_value: number;
  warranty_amount: number;
};

type MemberData = {
  name: string;
  role: string;
  avatar_url?: string;
};

type EquityData = {
  participation: number;
};

type DebtData = {
  percentage_profitability: string | null;
  payment_frequency: string;
  grace_period: number | null;
  total_installments: number;
  single_installment: boolean | null;
  status: string;
};

type OpportunityDetail = {
  id: number;
  name: string;
  status: string;
  modality: string;
  is_private: boolean;
  business_name: string;
  company_cnpj: string;
  description: string;
  about: string;
  resource_utilization: string;
  image: string;
  promotional_video_url: string | null;
  whatsapp_group: string | null;
  due_at: string | null;
  end_at: string | null;
  created_at: string;
  address?: {
    country: string;
    zip_code: string;
    street_name: string;
    number: string;
    district: string;
    city: string;
    state: string;
    complement: string | null;
  };
  total_investors: number;
  goal: GoalData;
  monetary: MonetaryData;
  members: MemberData[];
  equity?: EquityData;
  debt?: DebtData;
  warranties: { name: string }[];
  extra_images: { id: number; url: string }[];
  token_contract_address: string | null;
  gnosis_scan_url: string | null;
};

type InvestorData = {
  full_name: string;
  total_invested: number;
  email: string | null;
  phone: string | null;
  state: string | null;
  city: string | null;
  country: string | null;
};

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  review: { label: "Em análise", variant: "outline" },
  active: { label: "Ativa", variant: "default" },
  finished: { label: "Concluída", variant: "secondary" },
  archived: { label: "Arquivada", variant: "destructive" },
};

const FREQ_MAP: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  at_maturity: "No vencimento",
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [opp, setOpp] = useState<OpportunityDetail | null>(null);
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [anonymous, setAnonymous] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getOpportunity(Number(id)),
      getOpportunityInvestors(Number(id)).catch(() => ({ data: { investors: [], anonymous: 0 } })),
    ])
      .then(([oppRes, invRes]) => {
        setOpp(oppRes.data);
        setInvestors(invRes?.data?.investors ?? []);
        setAnonymous(invRes?.data?.anonymous ?? 0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (error || !opp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h2 className="text-2xl font-bold text-foreground">Campanha não encontrada</h2>
        <Button asChild variant="outline"><Link to="/app/campanhas">Voltar às campanhas</Link></Button>
      </div>
    );
  }

  const paidPct = Math.min(opp.goal.confirmed_payment_percentage, 100);
  const minGoalPct = opp.goal.max_goal > 0 ? Math.min((opp.goal.min_goal / opp.goal.max_goal) * 100, 100) : 0;
  const raisedVsMin = opp.goal.min_goal > 0 ? Math.round((opp.goal.confirmed_payment / opp.goal.min_goal) * 100) : 0;
  const deadlineKnown = parseOpportunityDate(opp.due_at) !== null;
  const st = STATUS_MAP[opp.status] ?? { label: opp.status, variant: "outline" as const };
  const quotaValue = opp.monetary.min_investment_value;
  const totalInvestors = opp.total_investors + anonymous;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/campanhas")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">{opp.name}</h1>
            <Badge variant={st.variant}>{st.label}</Badge>
            <Badge variant={opp.modality === "equity" ? "default" : "secondary"} className="capitalize">
              {opp.modality === "equity" ? "Equity" : "Dívida"}
            </Badge>
            {opp.is_private && <Badge variant="outline">Privada</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{opp.business_name}</p>
        </div>
      </div>

      {/* Hero Banner */}
      {opp.image && (
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden">
          <img src={opp.image} alt={opp.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white text-xl font-bold">{formatBRLFromCents(opp.goal.confirmed_payment)} captados</p>
            </div>
            {opp.promotional_video_url && (
              <a href={opp.promotional_video_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary" className="gap-2"><Play className="w-4 h-4" /> Ver vídeo</Button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={TrendingUp} label="Captado" value={formatBRLFromCents(opp.goal.confirmed_payment)} sub={`${paidPct.toFixed(1)}% da meta`} />
        <KPI icon={Users} label="Investidores" value={totalInvestors.toString()} sub={`${opp.total_investors} identificados · ${anonymous} anônimos`} />
        <KPI icon={Calendar} label="Prazo previsto" value={formatOpportunityDate(opp.due_at)} sub={deadlineKnown ? "Definido na aprovação" : "Ainda não definido"} />
        <KPI icon={CreditCard} label="Valor da cota" value={formatBRLFromCents(quotaValue)} sub={`Pend: ${formatBRLFromCents(opp.goal.unconfirmed_payment)}`} />
      </div>

      {/* Fundraising Progress */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso da captação</span>
          <span className="text-sm text-muted-foreground">{paidPct.toFixed(1)}% confirmado</span>
        </div>
        <div className="relative h-4">
          <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${paidPct}%` }} />
          </div>
          <div
            className="absolute top-0 h-4 border-l-2 border-dashed border-warning"
            style={{ left: `${minGoalPct}%` }}
            title={`Meta mínima: ${formatBRLFromCents(opp.goal.min_goal)}`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatBRLFromCents(opp.goal.confirmed_payment)} confirmados</span>
          <span>Meta mín. {formatBRLFromCents(opp.goal.min_goal)} ({raisedVsMin}%)</span>
          <span>Meta máx. {formatBRLFromCents(opp.goal.max_goal)}</span>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="investors">Investidores ({totalInvestors})</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          {opp.debt && <TabsTrigger value="debt">Dívida</TabsTrigger>}
          {opp.equity && <TabsTrigger value="equity">Equity</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <OpportunityContentEditor opportunity={opp} onReadback={setOpp} />
          <OverviewTab opp={opp} />
        </TabsContent>

        <TabsContent value="investors" className="mt-4">
          <InvestorsTab investors={investors} anonymous={anonymous} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <OpportunityDocumentsTab opportunityId={opp.id} opportunityStatus={opp.status} />
        </TabsContent>

        {opp.debt && (
          <TabsContent value="debt" className="mt-4">
            <DebtTab debt={opp.debt} opportunityId={opp.id} />
          </TabsContent>
        )}

        {opp.equity && (
          <TabsContent value="equity" className="mt-4">
            <EquityTab equity={opp.equity} goal={opp.goal} investors={investors} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function opportunityEditError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const response = error as { message?: string; errors?: Array<{ message?: string }> };
    return response.errors?.[0]?.message || response.message || "Não foi possível salvar as alterações.";
  }
  return "Não foi possível salvar as alterações.";
}

function OpportunityContentEditor({
  opportunity,
  onReadback,
}: {
  opportunity: OpportunityDetail;
  onReadback: (value: OpportunityDetail) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => toOwnerContentDraft(opportunity));
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [pendingPatch, setPendingPatch] = useState<OwnerContentPatch | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const editable = canEditOwnerContent(opportunity.status);

  async function confirmReadback(patch: OwnerContentPatch) {
    const response = await getOpportunity(opportunity.id);
    const current = response.data as OpportunityDetail;
    if (!ownerContentReadbackMatches(opportunity, patch, current)) {
      throw new Error("O servidor não confirmou os valores salvos. Consulte o estado antes de tentar salvar novamente.");
    }
    onReadback(current);
    setDraft(toOwnerContentDraft(current));
    setPendingPatch(null);
    setEditing(false);
    setSuccess(true);
    setError("");
  }

  async function save() {
    if (savingRef.current || pendingPatch || !editable) return;
    const patch = buildOwnerContentPatch(opportunity, draft);
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      setError("");
      return;
    }
    if ((patch.about !== undefined && !patch.about) ||
        (patch.description !== undefined && !patch.description)) {
      setError("Descrição e sobre a oportunidade não podem ficar vazios.");
      return;
    }
    if (patch.promotional_video_url) {
      try {
        const host = new URL(patch.promotional_video_url).hostname.toLowerCase();
        if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(host)) {
          throw new Error("Invalid YouTube host");
        }
      } catch {
        setError("Informe um link válido do YouTube ou deixe o campo vazio.");
        return;
      }
    }

    savingRef.current = true;
    setSaving(true);
    setError("");
    setSuccess(false);
    let patchSent = false;
    try {
      const before = await getOpportunity(opportunity.id);
      const current = before.data as OpportunityDetail;
      if (current.id !== opportunity.id || !canEditOwnerContent(current.status)) {
        setError("Esta oportunidade não está mais disponível para edição. Recarregue a página.");
        return;
      }
      if (current.about !== opportunity.about ||
          current.description !== opportunity.description ||
          current.promotional_video_url !== opportunity.promotional_video_url) {
        onReadback(current);
        setDraft(toOwnerContentDraft(current));
        setError("Os dados foram alterados em outra sessão. Revise o conteúdo atualizado antes de salvar.");
        return;
      }
      await updateOpportunity(opportunity.id, patch);
      patchSent = true;
      setPendingPatch(patch);
      await confirmReadback(patch);
    } catch (cause) {
      setError(patchSent
        ? `A alteração foi enviada, mas a leitura ainda não foi confirmada. ${opportunityEditError(cause)}`
        : opportunityEditError(cause));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function retryReadback() {
    if (!pendingPatch || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await confirmReadback(pendingPatch);
    } catch (cause) {
      setError(opportunityEditError(cause));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 border-border/60 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Conteúdo da oportunidade</h3>
          <p className="text-sm text-muted-foreground">
            {editable
              ? "Descrição, apresentação e vídeo podem ser ajustados enquanto a oportunidade está em análise ou ativa."
              : "A edição deste conteúdo não está disponível para esta etapa da oportunidade."}
          </p>
        </div>
        {editable && !editing && !pendingPatch && (
          <Button variant="outline" onClick={() => {
            setDraft(toOwnerContentDraft(opportunity));
            setError("");
            setSuccess(false);
            setEditing(true);
          }}>Editar conteúdo</Button>
        )}
      </div>
      {editing && !pendingPatch && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opportunity-description">Descrição</Label>
            <Textarea id="opportunity-description" value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opportunity-about">Sobre a oportunidade</Label>
            <Textarea id="opportunity-about" value={draft.about}
              onChange={(event) => setDraft({ ...draft, about: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opportunity-video">Vídeo promocional (YouTube)</Label>
            <Input id="opportunity-video" type="url" value={draft.promotional_video_url}
              onChange={(event) => setDraft({ ...draft, promotional_video_url: event.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar conteúdo"}</Button>
            <Button variant="outline" disabled={saving} onClick={() => {
              setDraft(toOwnerContentDraft(opportunity));
              setEditing(false);
              setError("");
            }}>Cancelar</Button>
          </div>
        </div>
      )}
      {pendingPatch && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">A alteração foi enviada; a confirmação de leitura ainda está pendente. Não envie novamente.</p>
          <Button variant="outline" disabled={saving} onClick={retryReadback}>
            {saving ? "Consultando..." : "Tentar confirmar leitura"}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-success">Conteúdo salvo e confirmado pela leitura da oportunidade.</p>}
    </Card>
  );
}

function opportunityDocumentErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const status = (error as { status?: unknown }).status;
    const message = (error as { message?: unknown }).message;
    const errors = (error as { errors?: Array<{ message?: unknown }> }).errors;
    const firstValidationMessage = errors?.find((item) => typeof item.message === "string")?.message;

    if (typeof firstValidationMessage === "string" && firstValidationMessage.trim()) {
      return firstValidationMessage;
    }
    if (status === 404) return "Documento ou oportunidade indisponível para esta conta.";
    if (status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
    if (typeof message === "string" && message.trim()) return message;
    if (status === 422) return "A operação não é permitida no estado atual da oportunidade.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

function OpportunityDocumentsTab({
  opportunityId,
  opportunityStatus,
}: {
  opportunityId: number;
  opportunityStatus: string;
}) {
  const [documents, setDocuments] = useState<OpportunityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<OpportunityDocumentWriteType>("other_documents");
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createFileKey, setCreateFileKey] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [replaceName, setReplaceName] = useState("");
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceFileKey, setReplaceFileKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<OpportunityDocument | null>(null);
  const [mutationKey, setMutationKey] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingReadback, setPendingReadback] = useState<OpportunityDocumentReadback | null>(null);
  const mutationLock = useRef(false);

  const loadDocuments = useCallback(async () => {
    const response = await getOpportunityDocuments(opportunityId);
    const nextDocuments = parseOpportunityDocuments(response);
    setDocuments(nextDocuments);
    return nextDocuments;
  }, [opportunityId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getOpportunityDocuments(opportunityId)
      .then((response) => {
        if (active) setDocuments(parseOpportunityDocuments(response));
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [opportunityId, retry]);

  const confirmReadback = async (expectation: OpportunityDocumentReadback) => {
    setPendingReadback(expectation);
    try {
      const nextDocuments = await loadDocuments();
      if (!opportunityDocumentReadbackMatches(expectation, nextDocuments)) {
        throw new Error("A alteração foi aceita, mas ainda não apareceu na leitura do servidor.");
      }
      setPendingReadback(null);
      setMutationError(null);
      return true;
    } catch (readbackError) {
      const message = readbackError instanceof Error && readbackError.message
        ? readbackError.message
        : opportunityDocumentErrorMessage(readbackError);
      setMutationError(`${message} Atualize o estado sem reenviar a alteração.`);
      return false;
    }
  };

  const resetConfirmedMutationForm = (expectation: OpportunityDocumentReadback) => {
    if (expectation.kind === "create" || expectation.kind === "create_without_id") {
      setCreateName("");
      setCreateType("other_documents");
      setCreateFile(null);
      setCreateFileKey((value) => value + 1);
    }
    if (expectation.kind === "replace") {
      setEditingId(null);
      setReplaceFile(null);
    }
  };

  const retryPendingReadback = async () => {
    if (!pendingReadback || mutationLock.current) return;
    const expectation = pendingReadback;
    mutationLock.current = true;
    setMutationKey("readback");
    setMutationError(null);
    const confirmed = await confirmReadback(expectation);
    if (confirmed) {
      resetConfirmedMutationForm(expectation);
      toast.success("Estado do documento confirmado pelo servidor.");
    }
    mutationLock.current = false;
    setMutationKey(null);
  };

  const downloadContract = async (document: OpportunityDocument) => {
    setDownloadingId(document.id);
    setDownloadError(false);
    try {
      const blob = await downloadOpportunityInvestmentContract(opportunityId, document.id);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      const safeName = document.name.replace(/[\\/:*?"<>|]/g, "-").replace(/\.pdf$/i, "") || "contrato";
      anchor.download = `${safeName}.pdf`;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloadingId(null);
    }
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (mutationLock.current || pendingReadback) return;

    const nameError = validateOpportunityDocumentName(createName);
    const fileError = validateOpportunityDocumentFile(createFile);
    if (nameError || fileError) {
      setMutationError(nameError ?? fileError);
      return;
    }
    if (!canCreateOpportunityDocument(opportunityStatus, createType, documents)) {
      setMutationError("Este tipo de documento não pode ser adicionado no estado atual da oportunidade.");
      return;
    }

    mutationLock.current = true;
    setMutationKey("create");
    setMutationError(null);
    try {
      const previousIds = documents.map((document) => document.id);
      const formData = new FormData();
      formData.append("name", createName.trim());
      formData.append("type", createType);
      formData.append("file", normalizeUploadFilename(createFile as File));
      const response = await uploadOpportunityDocument(opportunityId, formData);
      const id = parseCreatedOpportunityDocumentId(response);
      const expectation: OpportunityDocumentReadback = id
        ? { kind: "create", id, name: createName.trim(), type: createType }
        : { kind: "create_without_id", previousIds, name: createName.trim(), type: createType };
      const confirmed = await confirmReadback(expectation);
      if (confirmed) {
        resetConfirmedMutationForm(expectation);
        toast.success("Documento enviado e confirmado.");
      }
    } catch (createError) {
      setMutationError(opportunityDocumentErrorMessage(createError));
    } finally {
      mutationLock.current = false;
      setMutationKey(null);
    }
  };

  const beginReplace = (document: OpportunityDocument) => {
    setEditingId(document.id);
    setReplaceName(document.name);
    setReplaceFile(null);
    setReplaceFileKey((value) => value + 1);
    setMutationError(null);
  };

  const submitReplace = async (event: FormEvent, document: OpportunityDocument) => {
    event.preventDefault();
    if (mutationLock.current || pendingReadback) return;

    const nameError = validateOpportunityDocumentName(replaceName);
    const fileError = validateOpportunityDocumentFile(replaceFile);
    if (nameError || fileError) {
      setMutationError(nameError ?? fileError);
      return;
    }
    if (!canReplaceOpportunityDocument(opportunityStatus, document)) {
      setMutationError("Este documento não pode ser substituído no estado atual da oportunidade.");
      return;
    }

    mutationLock.current = true;
    setMutationKey(`replace-${document.id}`);
    setMutationError(null);
    try {
      const formData = new FormData();
      formData.append("name", replaceName.trim());
      formData.append("file", normalizeUploadFilename(replaceFile as File));
      await replaceOpportunityDocument(opportunityId, document.id, formData);
      const expectation: OpportunityDocumentReadback = {
        kind: "replace",
        previousId: document.id,
        previousIds: documents.map((item) => item.id),
        name: replaceName.trim(),
        type: document.type,
      };
      const confirmed = await confirmReadback(expectation);
      if (confirmed) {
        resetConfirmedMutationForm(expectation);
        toast.success("Documento substituído e confirmado.");
      }
    } catch (replaceError) {
      setMutationError(opportunityDocumentErrorMessage(replaceError));
    } finally {
      mutationLock.current = false;
      setMutationKey(null);
    }
  };

  const submitDelete = async () => {
    const document = deleteTarget;
    if (!document || mutationLock.current || pendingReadback) return;
    if (!canDeleteOpportunityDocument(opportunityStatus, document)) {
      setMutationError("Este documento não pode ser excluído no estado atual da oportunidade.");
      setDeleteTarget(null);
      return;
    }

    mutationLock.current = true;
    setMutationKey(`delete-${document.id}`);
    setMutationError(null);
    try {
      await deleteOpportunityDocument(opportunityId, document.id);
      setDeleteTarget(null);
      const confirmed = await confirmReadback({ kind: "delete", id: document.id });
      if (confirmed) toast.success("Documento excluído e estado confirmado.");
    } catch (deleteError) {
      setDeleteTarget(null);
      setMutationError(opportunityDocumentErrorMessage(deleteError));
    } finally {
      mutationLock.current = false;
      setMutationKey(null);
    }
  };

  const isReadOnly = opportunityStatus === "archived" || opportunityStatus === "finished";
  const createTypes = OPPORTUNITY_DOCUMENT_WRITE_TYPES.filter((type) =>
    canCreateOpportunityDocument(opportunityStatus, type, documents),
  );
  const mutationsDisabled = Boolean(mutationKey || pendingReadback || loading || error);

  return (
    <Card className="p-5 border-border/60 space-y-5">
      <div>
        <h3 className="font-semibold text-foreground">Documentos da oportunidade</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie apenas os arquivos desta oportunidade. Os documentos cadastrais da empresa permanecem separados no perfil.
        </p>
      </div>

      {isReadOnly && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          Esta oportunidade está {opportunityStatus === "archived" ? "arquivada" : "concluída"}. Os documentos estão disponíveis somente para leitura.
        </div>
      )}

      {pendingReadback && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" aria-live="polite">
          <p className="font-medium">Alteração enviada; confirmação de leitura pendente.</p>
          <p className="mt-1">Não reenvie a operação. Consulte novamente apenas o estado atual do servidor.</p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            disabled={mutationKey === "readback"}
            onClick={() => void retryPendingReadback()}
          >
            {mutationKey === "readback" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar estado
          </Button>
        </div>
      )}

      {mutationError && <p className="text-sm text-destructive" role="alert">{mutationError}</p>}

      {!isReadOnly && (
        <form className="rounded-lg border p-4 space-y-4" onSubmit={(event) => void submitCreate(event)}>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Adicionar documento da oportunidade</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`opportunity-document-name-${opportunityId}`}>Nome do documento</Label>
              <Input
                id={`opportunity-document-name-${opportunityId}`}
                maxLength={128}
                value={createName}
                disabled={mutationsDisabled}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Ex.: Demonstrações financeiras 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={createType}
                disabled={mutationsDisabled}
                onValueChange={(value) => setCreateType(value as OpportunityDocumentWriteType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {createTypes.map((type) => (
                    <SelectItem key={type} value={type}>{opportunityDocumentTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Tipos únicos já enviados não podem ser duplicados; “Outros documentos” é repetível.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`opportunity-document-file-${opportunityId}`}>Arquivo PDF</Label>
            <Input
              key={createFileKey}
              id={`opportunity-document-file-${opportunityId}`}
              type="file"
              accept="application/pdf,.pdf"
              disabled={mutationsDisabled}
              onChange={(event) => setCreateFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">PDF de até 20 MiB.</p>
          </div>
          <Button type="submit" size="sm" disabled={mutationsDisabled}>
            {mutationKey === "create" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {mutationKey === "create" ? "Enviando..." : "Enviar documento"}
          </Button>
        </form>
      )}

      {loading && <p className="text-sm text-muted-foreground">Carregando documentos...</p>}
      {error && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-destructive">
          Não foi possível carregar os documentos.
          <Button size="sm" variant="outline" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</Button>
        </div>
      )}
      {downloadError && <p className="text-sm text-destructive">Não foi possível baixar o contrato. Tente novamente.</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum documento da oportunidade disponível.</p>
      )}
      {!loading && !error && documents.length > 0 && (
        <ul className="space-y-3">
          {documents.map((document) => {
            const link = safeOpportunityDocumentUrl(document.download_link);
            const canReplace = canReplaceOpportunityDocument(opportunityStatus, document);
            const canDelete = canDeleteOpportunityDocument(opportunityStatus, document);
            const isEditing = editingId === document.id;
            return (
              <li key={document.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{document.name}</p>
                    <p className="text-xs text-muted-foreground">{opportunityDocumentTypeLabel(document.type)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {document.type === "investment_contract" ? (
                      <Button size="sm" variant="outline" disabled={downloadingId === document.id} onClick={() => void downloadContract(document)}>
                        <Download className="mr-2 h-4 w-4" /> {downloadingId === document.id ? "Baixando..." : "Baixar contrato"}
                      </Button>
                    ) : link ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={link} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" /> Abrir arquivo</a>
                      </Button>
                    ) : <span className="text-xs text-muted-foreground">Arquivo indisponível</span>}
                    {canReplace && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={mutationsDisabled}
                        onClick={() => isEditing ? setEditingId(null) : beginReplace(document)}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> {isEditing ? "Cancelar edição" : "Substituir"}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={mutationsDisabled}
                        onClick={() => setDeleteTarget(document)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <form className="rounded-md bg-muted/30 p-3 space-y-3" onSubmit={(event) => void submitReplace(event, document)}>
                    <p className="text-xs text-muted-foreground">
                      A substituição preserva o tipo “{opportunityDocumentTypeLabel(document.type)}” e exige um novo PDF.
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`replace-document-name-${document.id}`}>Nome do documento</Label>
                        <Input
                          id={`replace-document-name-${document.id}`}
                          maxLength={128}
                          value={replaceName}
                          disabled={mutationsDisabled}
                          onChange={(event) => setReplaceName(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`replace-document-file-${document.id}`}>Novo PDF</Label>
                        <Input
                          key={replaceFileKey}
                          id={`replace-document-file-${document.id}`}
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={mutationsDisabled}
                          onChange={(event) => setReplaceFile(event.target.files?.[0] ?? null)}
                        />
                      </div>
                    </div>
                    <Button type="submit" size="sm" disabled={mutationsDisabled}>
                      {mutationKey === `replace-${document.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {mutationKey === `replace-${document.id}` ? "Substituindo..." : "Confirmar substituição"}
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !mutationKey && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento da oportunidade?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo “{deleteTarget?.name}” será removido. Esta ação não altera os documentos cadastrais da empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(mutationKey)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={Boolean(mutationKey)}
              onClick={(event) => {
                event.preventDefault();
                void submitDelete();
              }}
            >
              {deleteTarget && mutationKey === `delete-${deleteTarget.id}` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir documento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────────────────────── */

function KPI({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: string; sub: string }) {
  return (
    <Card className="p-4 border-border/60">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

/* ─── Overview Tab ─────────────────────────────────────────────────────────── */

function OverviewTab({ opp }: { opp: OpportunityDetail }) {
  const savedBanking = readOpportunityBanking(opp);
  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border/60">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Descrição
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{opp.description}</p>
            {opp.about && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold text-foreground mb-3">Sobre a oportunidade</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{opp.about}</p>
              </>
            )}
          </Card>

          {opp.resource_utilization && (
            <Card className="p-6 border-border/60">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4" /> Destinação dos Recursos
              </h3>
              <p className="text-sm text-muted-foreground">{opp.resource_utilization}</p>
            </Card>
          )}

          {opp.members.length > 0 && (
            <Card className="p-6 border-border/60">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Equipe
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {opp.members.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                      : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{m.name[0]}</div>
                    }
                    <div>
                      <p className="font-medium text-sm text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {opp.warranties.length > 0 && (
            <Card className="p-6 border-border/60">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Garantias
              </h3>
              <ul className="space-y-1">
                {opp.warranties.map((w, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> {w.name}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {opp.address && (
            <Card className="p-6 border-border/60">
              <h3 className="font-semibold text-foreground mb-3">Endereço da oportunidade</h3>
              <p className="text-sm text-muted-foreground">
                {opp.address.street_name}, {opp.address.number}
                {opp.address.complement ? `, ${opp.address.complement}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {opp.address.district} · {opp.address.city}/{opp.address.state} · {opp.address.zip_code} · {opp.address.country}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Endereço da oferta, independente do endereço cadastrado no perfil.</p>
            </Card>
          )}

          <Card className="p-6 border-border/60 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4" /> Dados bancários da oportunidade
            </h3>
            <p className="text-xs text-muted-foreground">
              Valores salvos nesta oportunidade; alterações no perfil não modificam esta cópia.
            </p>
            {savedBanking ? (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Banco (ID)</span><p>{savedBanking.bank_account.bank_id ?? "Não informado"}</p></div>
                <div><span className="text-muted-foreground">Agência</span><p>{savedBanking.bank_account.agency ?? "Não informada"}</p></div>
                <div><span className="text-muted-foreground">Conta</span><p>{savedBanking.bank_account.account ?? "Não informada"}</p></div>
                <div><span className="text-muted-foreground">Dígito</span><p>{savedBanking.bank_account.account_digit ?? "Não informado"}</p></div>
                <div><span className="text-muted-foreground">Tipo de chave Pix</span><p>{savedBanking.pix.type ?? "Não informado"}</p></div>
                <div><span className="text-muted-foreground">Chave Pix</span><p className="break-all">{savedBanking.pix.key ?? "Não informada"}</p></div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">A leitura dos dados bancários desta oportunidade está indisponível.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 border-border/60 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Detalhes da Oferta</h3>
            <DetailRow icon={Building2} label="Empresa" value={opp.business_name} />
            {opp.company_cnpj && <DetailRow icon={FileText} label="CNPJ" value={opp.company_cnpj} />}
            <DetailRow icon={CreditCard} label="Valor da cota" value={formatBRLFromCents(opp.monetary.min_investment_value)} />
            <DetailRow icon={Shield} label="Garantia" value={formatBRLFromCents(opp.monetary.warranty_amount)} />
            <DetailRow icon={Calendar} label="Criada em" value={formatOpportunityDate(opp.created_at)} />
            <DetailRow icon={Calendar} label="Prazo previsto" value={formatOpportunityDate(opp.due_at)} />
            {parseOpportunityDate(opp.end_at) && <DetailRow icon={Calendar} label="Encerrada em" value={formatOpportunityDate(opp.end_at)} />}
            {opp.modality === "equity" && opp.equity && (
              <DetailRow icon={PieChart} label="Participação" value={`${opp.equity.participation}%`} />
            )}
            {opp.modality === "debt" && opp.debt && (
              <>
                <DetailRow icon={Percent} label="Rentabilidade" value={`${opp.debt.percentage_profitability ?? "—"}% a.a.`} />
                <DetailRow icon={Timer} label="Carência cadastrada" value={opp.debt.grace_period == null ? "Não informada" : `${opp.debt.grace_period} meses`} />
                <DetailRow icon={Banknote} label="Parcelas" value={`${opp.debt.total_installments}x`} />
                <DetailRow icon={Clock} label="Frequência" value={FREQ_MAP[opp.debt.payment_frequency] ?? opp.debt.payment_frequency} />
              </>
            )}
          </Card>

          <Card className="p-5 border-border/60 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Ações</h3>
            {opp.whatsapp_group && (
              <a href={opp.whatsapp_group} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <MessageCircle className="w-4 h-4" /> Grupo WhatsApp
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
            {opp.promotional_video_url && (
              <a href={opp.promotional_video_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" /> Vídeo promocional
                </Button>
              </a>
            )}
            {opp.gnosis_scan_url && (
              <a href={opp.gnosis_scan_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" /> Blockchain
                </Button>
              </a>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

/* ─── Investors Tab ────────────────────────────────────────────────────────── */

function InvestorsTab({ investors, anonymous }: { investors: InvestorData[]; anonymous: number }) {
  const totalInvested = investors.reduce((s, i) => s + i.total_invested, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-border/60 text-center">
          <p className="text-xs text-muted-foreground uppercase">Identificados</p>
          <p className="text-2xl font-bold text-foreground">{investors.length}</p>
        </Card>
        <Card className="p-4 border-border/60 text-center">
          <p className="text-xs text-muted-foreground uppercase">Anônimos</p>
          <p className="text-2xl font-bold text-foreground">{anonymous}</p>
        </Card>
        <Card className="p-4 border-border/60 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total captado</p>
          <p className="text-2xl font-bold text-success">{formatBRLFromCents(totalInvested)}</p>
        </Card>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Investidor</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Localização</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Total investido</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((inv, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-foreground">{inv.full_name}</p>
                    {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {inv.city && inv.state ? `${inv.city} / ${inv.state}` : inv.country ?? "—"}
                  </td>
                  <td className="p-3 text-right font-medium text-foreground">{formatBRLFromCents(inv.total_invested)}</td>
                </tr>
              ))}
              {anonymous > 0 && (
                <tr className="border-b border-border/50 bg-muted/10">
                  <td className="p-3 text-muted-foreground italic" colSpan={2}>+ {anonymous} investidor(es) anônimo(s)</td>
                  <td className="p-3" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {investors.length === 0 && anonymous === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">Nenhum investidor confirmado</div>
        )}
      </Card>
    </div>
  );
}

/* ─── Debt Tab ─────────────────────────────────────────────────────────────── */

function DebtTab({ debt, opportunityId }: { debt: DebtData; opportunityId: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs uppercase">Rentabilidade</span>
          </div>
          <p className="text-xl font-bold text-foreground">{debt.percentage_profitability ?? "—"}% a.a.</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase">Frequência</span>
          </div>
          <p className="text-xl font-bold text-foreground">{FREQ_MAP[debt.payment_frequency] ?? debt.payment_frequency}</p>
          {debt.grace_period != null && <p className="text-xs text-muted-foreground">{debt.grace_period} meses de carência</p>}
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Banknote className="w-4 h-4" />
            <span className="text-xs uppercase">Parcelas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{debt.total_installments}x</p>
          {debt.single_installment && <p className="text-xs text-muted-foreground">Parcela única</p>}
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs uppercase">Status dívida</span>
          </div>
          <p className="text-xl font-bold text-foreground capitalize">{debt.status}</p>
        </Card>
      </div>

      <Card className="p-5 border-border/60 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-medium text-foreground text-sm">Cronograma de Parcelas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Veja o calendário completo de pagamentos, taxas e penalidades.</p>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link to={`/app/campanhas/${opportunityId}/divida`}>
            <Banknote className="w-4 h-4" /> Ver parcelas
          </Link>
        </Button>
      </Card>
    </div>
  );
}

/* ─── Equity Tab ───────────────────────────────────────────────────────────── */

function EquityTab({ equity, goal, investors }: { equity: EquityData; goal: GoalData; investors: InvestorData[] }) {
  const investorPct = goal.max_goal > 0
    ? Math.min((goal.confirmed_payment / goal.max_goal) * equity.participation, equity.participation)
    : 0;
  const founderPct = 100 - equity.participation;
  const valuation = equity.participation > 0 ? Math.round(goal.max_goal / (equity.participation / 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <PieChart className="w-4 h-4" />
            <span className="text-xs uppercase">Participação ofertada</span>
          </div>
          <p className="text-xl font-bold text-foreground">{equity.participation}%</p>
          <p className="text-xs text-muted-foreground">da empresa</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Banknote className="w-4 h-4" />
            <span className="text-xs uppercase">Valuation implícito</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatBRLFromCents(valuation)}</p>
          <p className="text-xs text-muted-foreground">pre-money</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase">Investidores</span>
          </div>
          <p className="text-xl font-bold text-foreground">{investors.length}</p>
          <p className="text-xs text-muted-foreground">confirmados</p>
        </Card>
      </div>

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold text-foreground mb-4">Distribuição da Participação</h3>
        <div className="flex h-8 rounded-full overflow-hidden bg-muted/50 mb-4">
          <div className="bg-primary transition-all" style={{ width: `${founderPct}%` }} title={`Fundadores: ${founderPct.toFixed(1)}%`} />
          <div className="bg-accent transition-all" style={{ width: `${investorPct}%` }} title={`Investidores: ${investorPct.toFixed(2)}%`} />
          <div className="bg-muted transition-all" style={{ width: `${equity.participation - investorPct}%` }} title="Disponível" />
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> Fundadores ({founderPct.toFixed(1)}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent" /> Investidores ({investorPct.toFixed(2)}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-muted" /> Disponível ({(equity.participation - investorPct).toFixed(2)}%)</span>
        </div>
      </Card>

      {investors.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Cap Table (Investidores Confirmados)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Investidor</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Localização</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total investido</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{inv.full_name}</p>
                      {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {inv.city && inv.state ? `${inv.city} / ${inv.state}` : "—"}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">{formatBRLFromCents(inv.total_invested)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}
