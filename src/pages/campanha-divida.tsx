import { useParams, useNavigate, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Percent, Clock, Banknote, AlertCircle, CheckCircle2, Timer, Calendar,
  QrCode, FlaskConical, X, Copy, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getDebt, getDebtSummary, updateDebtSchedule, payNextInstallment, debtSimulatePayment } from "@/services/api";
import { formatBRLFromCents } from "@/utils/br-formatters";
import {
  formatProfitabilityWithBasis,
  profitabilityBasisLabel,
} from "@/features/campaign-creation/opportunity-presentation-alignment";
import { formatGracePeriod, parseGracePeriod, readGracePeriod, type GracePeriodDetail } from "@/features/campaign-debt/grace-period";
import {
  formatDebtSummaryDate,
  isIsoDate,
  parseDebtSummary,
  type DebtSummary,
} from "@/features/campaign-debt/debt-summary";

const FREQ_MAP: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  at_maturity: "No vencimento",
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  unica: "Única",
};

type SerializedDueDate = string | null | { c?: { year?: number; month?: number; day?: number } };

type Installment = {
  id: number;
  value: number;
  due_date: SerializedDueDate;
  status: string;
};

type ChargeData = {
  id: number;
  value: number;
  txid: string;
  qr_code: string;
  expiration_at: string | null;
};

function parseDueDate(raw: SerializedDueDate): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  // Luxon DateTime serialized as object: { c: { year, month, day, ... } }
  if (typeof raw === 'object') {
    const c = raw.c;
    if (c && c.year && c.month && c.day) {
      const y = String(c.year).padStart(4, '0');
      const m = String(c.month).padStart(2, '0');
      const d = String(c.day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

function debtActionError(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const response = error as { errors?: Array<{ message?: string }>; message?: string };
    return response.errors?.[0]?.message ?? response.message ?? fallback;
  }
  return fallback;
}

const IS_DEV = import.meta.env.DEV;

type DebtDetail = {
  id: number;
  percentageProfitability: string | null;
  paymentFrequency: string;
  gracePeriod: number | null;
  grace_period_detail?: GracePeriodDetail;
  paymentStartAt: string | null;
  totalInstallments: number;
  singleInstallment: boolean | null;
  status: string;
  opportunity: {
    id: number;
    name: string;
    business_name: string;
    status: string;
  };
  penalties: { id: number; name: string; penaltyType: string; percentageValue: number | null; fixedValue: number | null }[];
  fees: { id: number; feeType: string; percentageValue: number | null; fixedValue: number | null }[];
  installments: Installment[];
};

function InstallmentBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge className="bg-success text-success-foreground hover:bg-success text-xs">Paga</Badge>;
  if (status === "overdue") return <Badge variant="destructive" className="text-xs">Em atraso</Badge>;
  if (status === "waiting_payment") return <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-xs">Aguardando pagto.</Badge>;
  return <Badge variant="outline" className="text-xs">Pendente</Badge>;
}

export default function CampaignDebtPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [charging, setCharging] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [charge, setCharge] = useState<ChargeData | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const [summaryRetry, setSummaryRetry] = useState(0);
  const [scheduleEditing, setScheduleEditing] = useState(false);
  const [paymentStartDraft, setPaymentStartDraft] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const scheduleSavingRef = useRef(false);
  const [pendingDateReadback, setPendingDateReadback] = useState<string | null | undefined>(undefined);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [graceEditing, setGraceEditing] = useState(false);
  const [graceYears, setGraceYears] = useState("0");
  const [graceMonths, setGraceMonths] = useState("0");
  const [graceDays, setGraceDays] = useState("0");
  const [graceSaving, setGraceSaving] = useState(false);
  const graceSavingRef = useRef(false);
  const [pendingGraceReadback, setPendingGraceReadback] = useState<GracePeriodDetail | null>(null);
  const [graceError, setGraceError] = useState("");
  const [graceSuccess, setGraceSuccess] = useState(false);

  const reload = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    setCharge(null);
    getDebt(Number(id))
      .then((res) => setDebt(res?.data ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    setScheduleEditing(false);
    setPendingDateReadback(undefined);
    setScheduleError("");
    setScheduleSuccess(false);
    setGraceEditing(false);
    setPendingGraceReadback(null);
    setGraceError("");
    setGraceSuccess(false);
  }, [id]);

  useEffect(() => {
    if (!debt || graceEditing || pendingGraceReadback) return;
    const current = readGracePeriod(debt.grace_period_detail, debt.gracePeriod);
    setGraceYears(String(current?.years ?? 0));
    setGraceMonths(String(current?.months ?? 0));
    setGraceDays(String(current?.days ?? 0));
  }, [debt, graceEditing, pendingGraceReadback]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setSummary(null);
    setSummaryError(false);
    setSummaryLoading(true);
    getDebtSummary(Number(id))
      .then((response) => {
        if (!active) return;
        const parsed = parseDebtSummary(response?.data);
        if (parsed) setSummary(parsed);
        else setSummaryError(true);
      })
      .catch(() => { if (active) setSummaryError(true); })
      .finally(() => { if (active) setSummaryLoading(false); });
    return () => { active = false; };
  }, [id, summaryRetry]);

  useEffect(() => {
    if (summary && !scheduleEditing && pendingDateReadback === undefined) {
      setPaymentStartDraft(summary.payment_start_at ?? "");
    }
  }, [summary, scheduleEditing, pendingDateReadback]);

  async function confirmScheduleReadback(expected: string | null) {
    if (!id) return;
    const [summaryResponse, debtResponse] = await Promise.all([
      getDebtSummary(Number(id)), getDebt(Number(id)),
    ]);
    const currentSummary = parseDebtSummary(summaryResponse?.data);
    const currentDebt = debtResponse?.data as DebtDetail | undefined;
    if (!currentSummary || !currentDebt ||
        currentSummary.payment_start_at !== expected || currentDebt.paymentStartAt !== expected) {
      throw new Error("A data enviada não foi confirmada pelas leituras da dívida e do cronograma.");
    }
    setSummary(currentSummary);
    setDebt(currentDebt);
    setPaymentStartDraft(expected ?? "");
    setPendingDateReadback(undefined);
    setScheduleEditing(false);
    setScheduleSuccess(true);
    setScheduleError("");
  }

  async function saveScheduleDate() {
    if (!id || !debt || !summary || debt.opportunity.status !== "review" ||
        scheduleSavingRef.current || pendingDateReadback !== undefined) return;
    const nextDate = paymentStartDraft.trim() || null;
    if (nextDate && !isIsoDate(nextDate)) {
      setScheduleError("Informe uma data válida no formato AAAA-MM-DD.");
      return;
    }
    if (nextDate === summary.payment_start_at) {
      setScheduleEditing(false);
      setScheduleError("");
      return;
    }

    scheduleSavingRef.current = true;
    setScheduleSaving(true);
    setScheduleError("");
    setScheduleSuccess(false);
    let patchSent = false;
    try {
      const [beforeSummaryResponse, beforeDebtResponse] = await Promise.all([
        getDebtSummary(Number(id)), getDebt(Number(id)),
      ]);
      const beforeSummary = parseDebtSummary(beforeSummaryResponse?.data);
      const beforeDebt = beforeDebtResponse?.data as DebtDetail | undefined;
      if (!beforeSummary || !beforeDebt || beforeDebt.opportunity.status !== "review" ||
          beforeSummary.payment_start_at !== summary.payment_start_at ||
          beforeDebt.paymentStartAt !== summary.payment_start_at) {
        setScheduleError("A data ou o status mudou no servidor. Recarregue a página antes de editar.");
        return;
      }
      await updateDebtSchedule(Number(id), { payment_start_at: nextDate });
      patchSent = true;
      setPendingDateReadback(nextDate);
      await confirmScheduleReadback(nextDate);
    } catch (error) {
      setScheduleError(patchSent
        ? `A alteração foi enviada, mas ainda não confirmada. ${debtActionError(error, "Tente consultar novamente sem reenviar.")}`
        : debtActionError(error, "Não foi possível salvar a data."));
    } finally {
      scheduleSavingRef.current = false;
      setScheduleSaving(false);
    }
  }

  async function retryScheduleReadback() {
    if (pendingDateReadback === undefined || scheduleSavingRef.current) return;
    scheduleSavingRef.current = true;
    setScheduleSaving(true);
    setScheduleError("");
    try {
      await confirmScheduleReadback(pendingDateReadback);
    } catch (error) {
      setScheduleError(debtActionError(error, "Ainda não foi possível confirmar a data."));
    } finally {
      scheduleSavingRef.current = false;
      setScheduleSaving(false);
    }
  }

  async function confirmGraceReadback(expected: GracePeriodDetail) {
    if (!id) return;
    const [debtResponse, summaryResponse] = await Promise.all([getDebt(Number(id)), getDebtSummary(Number(id))]);
    const currentDebt = debtResponse?.data as DebtDetail | undefined;
    const currentSummary = parseDebtSummary(summaryResponse?.data);
    const saved = readGracePeriod(currentDebt?.grace_period_detail, currentDebt?.gracePeriod);
    const scheduled = readGracePeriod(currentSummary?.grace_period_detail, currentSummary?.grace_period);
    const matches = (part: GracePeriodDetail | null) => part?.years === expected.years && part.months === expected.months && part.days === expected.days;
    if (!currentDebt || !currentSummary || !matches(saved) || !matches(scheduled)) {
      throw new Error("A carência enviada não foi confirmada no GET da dívida e do cronograma.");
    }
    setDebt(currentDebt);
    setSummary(currentSummary);
    setPendingGraceReadback(null);
    setGraceEditing(false);
    setGraceSuccess(true);
    setGraceError("");
  }

  async function saveGracePeriod() {
    if (!id || !debt || debt.opportunity.status !== "review" || graceSavingRef.current || pendingGraceReadback) return;
    const next = parseGracePeriod(graceYears, graceMonths, graceDays);
    if (!next) { setGraceError("Informe inteiros não negativos; 0/0/0 é inválido."); return; }
    const current = readGracePeriod(debt.grace_period_detail, debt.gracePeriod);
    if (current && current.years === next.years && current.months === next.months && current.days === next.days) {
      setGraceEditing(false);
      setGraceError("");
      return;
    }
    graceSavingRef.current = true;
    setGraceSaving(true);
    setGraceError("");
    setGraceSuccess(false);
    let patchStarted = false;
    try {
      const before = (await getDebt(Number(id)))?.data as DebtDetail | undefined;
      const beforeGrace = readGracePeriod(before?.grace_period_detail, before?.gracePeriod);
      if (!before || before.opportunity.status !== "review" || !beforeGrace || !current ||
          beforeGrace.years !== current.years || beforeGrace.months !== current.months || beforeGrace.days !== current.days) {
        throw new Error("A carência ou o status mudou no servidor. Atualize a leitura antes de editar.");
      }
      patchStarted = true;
      setPendingGraceReadback(next);
      await updateDebtSchedule(Number(id), { grace_period_detail: next });
      await confirmGraceReadback(next);
    } catch (error) {
      if (!patchStarted) setPendingGraceReadback(null);
      setGraceError(patchStarted
        ? `O PATCH pode ter sido enviado. Confirme somente a leitura antes de repetir. ${debtActionError(error, "")}`
        : debtActionError(error, "Não foi possível salvar a carência."));
    } finally {
      graceSavingRef.current = false;
      setGraceSaving(false);
    }
  }

  async function retryGraceReadback() {
    if (!pendingGraceReadback || graceSavingRef.current) return;
    graceSavingRef.current = true;
    setGraceSaving(true);
    try { await confirmGraceReadback(pendingGraceReadback); }
    catch (error) { setGraceError(debtActionError(error, "A leitura ainda não confirmou a carência.")); }
    finally { graceSavingRef.current = false; setGraceSaving(false); }
  }

  const handleGenerateCharge = async () => {
    if (!id) return;
    setCharging(true);
    setChargeError(null);
    try {
      const res = await payNextInstallment(Number(id));
      setCharge(res?.data ?? null);
    } catch (error: unknown) {
      setChargeError(debtActionError(error, 'Erro ao gerar cobrança'));
    } finally {
      setCharging(false);
    }
  };

  const handleSimulate = async () => {
    if (!charge?.txid) return;
    setSimulating(true);
    try {
      await debtSimulatePayment(charge.txid);
      setCharge(null);
      reload();
      setSummaryRetry((value) => value + 1);
    } catch (error: unknown) {
      setChargeError(debtActionError(error, 'Erro ao simular pagamento'));
    } finally {
      setSimulating(false);
    }
  };

  const handleCopy = () => {
    if (!charge?.qr_code) return;
    navigator.clipboard.writeText(charge.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !debt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h2 className="text-2xl font-bold text-foreground">Dados de dívida não encontrados</h2>
        <Button asChild variant="outline">
          <Link to={`/app/campanhas/${id}`}>Voltar à campanha</Link>
        </Button>
      </div>
    );
  }

  const installments = debt.installments;
  const paid = installments.filter((i) => i.status === "paid");
  const overdue = installments.filter((i) => i.status === "overdue");
  const waitingPayment = installments.filter((i) => i.status === "waiting_payment");
  const pending = installments.filter((i) => i.status === "pending");
  const totalPaid = paid.reduce((s, i) => s + Number(i.value), 0);
  const totalRemaining = [...overdue, ...pending, ...waitingPayment].reduce((s, i) => s + Number(i.value), 0);
  const progressPct = installments.length > 0 ? Math.round((paid.length / installments.length) * 100) : 0;
  const hasNextPending = pending.length > 0 || overdue.length > 0;
  const hasWaitingPayment = waitingPayment.length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/app/campanhas/${id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestão de Dívida</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {debt.opportunity.name} · {debt.opportunity.business_name}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs uppercase">Rentabilidade</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatProfitabilityWithBasis(debt.percentageProfitability, summary?.profitability_basis)}</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase">Frequência</span>
          </div>
          <p className="text-xl font-bold text-foreground">{FREQ_MAP[debt.paymentFrequency] ?? debt.paymentFrequency}</p>
          <p className="text-xs text-muted-foreground">Carência: {formatGracePeriod(readGracePeriod(debt.grace_period_detail, debt.gracePeriod))}</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs uppercase">Pagas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{paid.length}/{installments.length}</p>
          <p className="text-xs text-muted-foreground">{formatBRLFromCents(totalPaid)}</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-warning-foreground mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs uppercase">Restante</span>
          </div>
          <p className="text-xl font-bold text-foreground">{overdue.length + pending.length}</p>
          <p className="text-xs text-muted-foreground">{formatBRLFromCents(totalRemaining)}</p>
        </Card>
      </div>

      <Card className="p-5 border-border/60 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">Carência da dívida</h3>
            <p className="text-sm text-muted-foreground">{formatGracePeriod(readGracePeriod(debt.grace_period_detail, debt.gracePeriod))}</p>
          </div>
          {debt.opportunity.status === "review" && !graceEditing && !pendingGraceReadback && (
            <Button variant="outline" onClick={() => { setGraceEditing(true); setGraceError(""); setGraceSuccess(false); }}>Editar carência</Button>
          )}
        </div>
        {debt.opportunity.status !== "review" && <p className="text-xs text-muted-foreground">Carência congelada após aprovação; somente leitura.</p>}
        {graceEditing && !pendingGraceReadback && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm">Anos<input type="number" min="0" step="1" value={graceYears} onChange={(event) => setGraceYears(event.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm">Meses<input type="number" min="0" step="1" value={graceMonths} onChange={(event) => setGraceMonths(event.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm">Dias<input type="number" min="0" step="1" value={graceDays} onChange={(event) => setGraceDays(event.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3" /></label>
            </div>
            {!parseGracePeriod(graceYears, graceMonths, graceDays) && <p role="alert" className="text-sm text-destructive">0/0/0 é inválido; informe inteiros não negativos.</p>}
            <div className="flex gap-2">
              <Button onClick={() => void saveGracePeriod()} disabled={graceSaving || !parseGracePeriod(graceYears, graceMonths, graceDays)}>{graceSaving ? "Salvando..." : "Salvar carência"}</Button>
              <Button variant="outline" onClick={() => setGraceEditing(false)} disabled={graceSaving}>Cancelar</Button>
            </div>
          </div>
        )}
        {pendingGraceReadback && <Button variant="outline" onClick={() => void retryGraceReadback()} disabled={graceSaving}>Confirmar leitura sem reenviar PATCH</Button>}
        {graceError && <p role="alert" className="text-sm text-destructive">{graceError}</p>}
        {graceSuccess && <p role="status" className="text-sm text-success">Carência confirmada na dívida e no cronograma.</p>}
      </Card>

      {/* Progress */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso dos pagamentos</span>
          <span className="text-sm text-muted-foreground">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{paid.length} paga(s)</span>
          {overdue.length > 0 && (
            <span className="text-destructive font-medium">{overdue.length} em atraso</span>
          )}
          {waitingPayment.length > 0 && (
            <span className="text-amber-600 font-medium">{waitingPayment.length} aguardando pagto.</span>
          )}
          <span>{pending.length} pendente(s)</span>
        </div>
      </Card>

      {/* Cobrança em aberto / Gerar cobrança */}
      {hasWaitingPayment ? (
        <Card className="p-5 border-amber-400/60 bg-amber-50/40 border-2 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-600" /> Cobrança em aberto
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Há uma parcela aguardando pagamento. Visualize o QR Code ou simule o pagamento.
              </p>
            </div>
            {!charge && (
              <Button
                variant="outline"
                onClick={handleGenerateCharge}
                disabled={charging}
                className="gap-2 shrink-0"
              >
                {charging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                {charging ? "Buscando..." : "Ver QR Code"}
              </Button>
            )}
          </div>

          {charge && (
            <div className="space-y-3">
              {charge.qr_code && (
                <div className="flex justify-center py-2">
                  <div className="bg-white p-3 rounded-lg border border-border inline-block">
                    <QRCodeSVG value={charge.qr_code} size={180} />
                  </div>
                </div>
              )}
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Código PIX Copia e Cola</p>
                <p className="text-xs font-mono break-all text-foreground leading-relaxed">{charge.qr_code}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 flex-1" onClick={handleCopy}>
                  <Copy className="w-4 h-4" />
                  {copied ? "Copiado!" : "Copiar código PIX"}
                </Button>
                {IS_DEV && (
                  <Button
                    variant="outline"
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                    {simulating ? "Simulando..." : "Simular pagamento"}
                  </Button>
                )}
              </div>
              {charge.expiration_at && (
                <p className="text-xs text-muted-foreground">
                  Expira em: {new Date(charge.expiration_at).toLocaleString("pt-BR")}
                </p>
              )}
              {charge.txid && (
                <p className="text-xs text-muted-foreground">TXID: <span className="font-mono">{charge.txid}</span></p>
              )}
            </div>
          )}
          {chargeError && (
            <p className="text-sm text-destructive">{chargeError}</p>
          )}
        </Card>
      ) : (
        <Card className="p-5 border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground text-sm">Gerar cobrança da próxima parcela</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasNextPending
                  ? "Gera um QR Code PIX para pagamento da parcela pendente."
                  : "Todas as parcelas já foram pagas."}
              </p>
            </div>
            <Button
              onClick={handleGenerateCharge}
              disabled={charging || !hasNextPending}
              className="gap-2 shrink-0"
            >
              {charging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {charging ? "Gerando..." : "Gerar cobrança"}
            </Button>
          </div>
          {chargeError && (
            <p className="mt-3 text-sm text-destructive">{chargeError}</p>
          )}
        </Card>
      )}

      {/* Fees & Penalties */}
      {(debt.fees.length > 0 || debt.penalties.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {debt.fees.length > 0 && (
            <Card className="p-5 border-border/60 space-y-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Percent className="w-4 h-4" /> Taxas
              </h3>
              {debt.fees.map((f) => (
                <div key={f.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{f.feeType.replace(/_/g, " ")}</span>
                  <span className="font-medium text-foreground">
                    {f.percentageValue != null ? `${f.percentageValue}%` : formatBRLFromCents(f.fixedValue ?? 0)}
                  </span>
                </div>
              ))}
            </Card>
          )}
          {debt.penalties.length > 0 && (
            <Card className="p-5 border-border/60 space-y-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Multas e Penalidades
              </h3>
              {debt.penalties.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium text-foreground">
                    {p.percentageValue != null ? `${p.percentageValue}%` : formatBRLFromCents(p.fixedValue ?? 0)}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Authoritative projection, separate from generated installment state. */}
      <Card className="p-5 border-border/60 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Prévia do cronograma (API)</h3>
          <p className="text-xs text-muted-foreground mt-1">Projeção não indica parcela gerada, cobrada ou paga. As datas vêm do resumo da API; valores cobrados e status constam nas parcelas registradas abaixo.</p>
        </div>
        {summaryLoading && <Skeleton className="h-24 w-full" />}
        {!summaryLoading && summaryError && (
          <div className="flex items-center justify-between gap-3">
            <p role="alert" className="text-sm text-destructive">Não foi possível carregar a prévia do cronograma.</p>
            <Button variant="outline" onClick={() => setSummaryRetry((value) => value + 1)}>Tentar novamente</Button>
          </div>
        )}
        {!summaryLoading && summary && (
          <>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div><p className="text-muted-foreground">Base usada pela API</p><p className="font-medium">{formatDebtSummaryDate(summary.base_date)}</p></div>
              <div><p className="text-muted-foreground">Início configurado</p><p className="font-medium">{summary.payment_start_at ? formatDebtSummaryDate(summary.payment_start_at) : "Não configurado"}</p></div>
              <div><p className="text-muted-foreground">Primeiro vencimento projetado</p><p className="font-medium">{formatDebtSummaryDate(summary.first_due)}</p></div>
            </div>
            <p className="text-xs text-muted-foreground">{summary.total_installments} parcela(s) · Carência: {formatGracePeriod(readGracePeriod(summary.grace_period_detail, summary.grace_period))} · {FREQ_MAP[summary.payment_frequency] ?? summary.payment_frequency}</p>
            <p className="text-xs text-muted-foreground">Base da rentabilidade retornada pela API: {profitabilityBasisLabel(summary.profitability_basis)}</p>
            {summary.parcelas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 text-left">Parcela prevista</th>
                    <th className="py-2 text-right">Vencimento previsto</th>
                  </tr></thead>
                  <tbody>{summary.parcelas.map((row) => (
                    <tr key={row.installment_number} className="border-b border-border/50">
                      <td className="py-2">{row.installment_number}ª</td>
                      <td className="py-2 text-right">{formatDebtSummaryDate(row.due_date)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-foreground">A API ainda não retornou parcelas projetadas.</p>}
          </>
        )}
      </Card>

      {summary && (
        <Card className="p-5 border-border/60 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Início configurado dos pagamentos</h3>
              <p className="text-sm text-muted-foreground">{summary.payment_start_at ? formatDebtSummaryDate(summary.payment_start_at) : "Não configurado — a API determina a base do cronograma."}</p>
            </div>
            {debt.opportunity.status === "review" && !scheduleEditing && pendingDateReadback === undefined && (
              <Button variant="outline" onClick={() => {
                setPaymentStartDraft(summary.payment_start_at ?? "");
                setScheduleError("");
                setScheduleSuccess(false);
                setScheduleEditing(true);
              }}>Editar data</Button>
            )}
          </div>
          {debt.opportunity.status !== "review" && <p className="text-xs text-muted-foreground">A data é somente leitura fora da etapa de análise.</p>}
          {scheduleEditing && pendingDateReadback === undefined && (
            <div className="space-y-3">
              <label htmlFor="debt-payment-start" className="block text-sm font-medium">Data de início (opcional)</label>
              <input id="debt-payment-start" type="date" value={paymentStartDraft}
                onChange={(event) => setPaymentStartDraft(event.target.value)}
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <Button disabled={scheduleSaving} onClick={saveScheduleDate}>{scheduleSaving ? "Salvando..." : "Salvar data"}</Button>
                <Button variant="outline" disabled={scheduleSaving} onClick={() => {
                  setScheduleEditing(false);
                  setPaymentStartDraft(summary.payment_start_at ?? "");
                  setScheduleError("");
                }}>Cancelar</Button>
              </div>
            </div>
          )}
          {pendingDateReadback !== undefined && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">O PATCH foi enviado; confirme a leitura sem enviar novamente.</p>
              <Button variant="outline" disabled={scheduleSaving} onClick={retryScheduleReadback}>
                {scheduleSaving ? "Consultando..." : "Tentar confirmar leitura"}
              </Button>
            </div>
          )}
          {scheduleError && <p role="alert" className="text-sm text-destructive">{scheduleError}</p>}
          {scheduleSuccess && <p role="status" className="text-sm text-success">Data salva e confirmada na dívida e no cronograma.</p>}
        </Card>
      )}

      {/* Generated installments, never inferred from the projection. */}
      <Card className="border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Banknote className="w-4 h-4" /> Parcelas registradas
          </h3>
          <span className="text-xs text-muted-foreground">{installments.length} parcela(s) no total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Nº</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-right p-3 font-medium text-muted-foreground">
                  <span className="flex items-center justify-end gap-1"><Calendar className="w-3.5 h-3.5" /> Vencimento</span>
                </th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((inst, idx) => {
                const isoDate = parseDueDate(inst.due_date);
                return (
                  <tr
                    key={inst.id}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${inst.status === "overdue" ? "bg-destructive/5" : ""}`}
                  >
                    <td className="p-3 font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                        {idx + 1}ª parcela
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">{formatBRLFromCents(inst.value)}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {isoDate ? new Date(isoDate).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <InstallmentBadge status={inst.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {installments.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            Nenhuma parcela registrada ainda.
          </div>
        )}
      </Card>
    </div>
  );
}
