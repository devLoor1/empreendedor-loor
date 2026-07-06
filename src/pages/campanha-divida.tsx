import { useParams, useNavigate, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Percent, Clock, Banknote, AlertCircle, CheckCircle2, Timer, Calendar,
  QrCode, FlaskConical, X, Copy, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getDebt, payNextInstallment, debtSimulatePayment } from "@/services/api";

const FREQ_MAP: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  at_maturity: "No vencimento",
};

type Installment = {
  id: number;
  value: number;
  due_date: string | null | Record<string, any>;
  status: string;
};

type ChargeData = {
  id: number;
  value: number;
  txid: string;
  qr_code: string;
  expiration_at: string | null;
};

function parseDueDate(raw: string | null | Record<string, any>): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  // Luxon DateTime serialized as object: { c: { year, month, day, ... } }
  if (typeof raw === 'object') {
    const c = (raw as any).c;
    if (c && c.year && c.month && c.day) {
      const y = String(c.year).padStart(4, '0');
      const m = String(c.month).padStart(2, '0');
      const d = String(c.day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

const IS_DEV = import.meta.env.DEV;

type DebtDetail = {
  id: number;
  percentageProfitability: string | null;
  paymentFrequency: string;
  gracePeriod: number | null;
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

function formatBRL(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

  const reload = () => {
    if (!id) return;
    setLoading(true);
    setCharge(null);
    getDebt(Number(id))
      .then((res) => setDebt(res?.data ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [id]);

  const handleGenerateCharge = async () => {
    if (!id) return;
    setCharging(true);
    setChargeError(null);
    try {
      const res = await payNextInstallment(Number(id));
      setCharge(res?.data ?? null);
    } catch (e: any) {
      setChargeError(e?.errors?.[0]?.message ?? 'Erro ao gerar cobrança');
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
    } catch (e: any) {
      setChargeError(e?.errors?.[0]?.message ?? e?.message ?? 'Erro ao simular pagamento');
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
          <p className="text-xl font-bold text-foreground">{debt.percentageProfitability ?? "—"}% a.a.</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase">Frequência</span>
          </div>
          <p className="text-xl font-bold text-foreground">{FREQ_MAP[debt.paymentFrequency] ?? debt.paymentFrequency}</p>
          {debt.gracePeriod != null && (
            <p className="text-xs text-muted-foreground">{debt.gracePeriod} meses carência</p>
          )}
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs uppercase">Pagas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{paid.length}/{installments.length}</p>
          <p className="text-xs text-muted-foreground">{formatBRL(totalPaid)}</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-warning-foreground mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs uppercase">Restante</span>
          </div>
          <p className="text-xl font-bold text-foreground">{overdue.length + pending.length}</p>
          <p className="text-xs text-muted-foreground">{formatBRL(totalRemaining)}</p>
        </Card>
      </div>

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
                    {f.percentageValue != null ? `${f.percentageValue}%` : formatBRL(f.fixedValue ?? 0)}
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
                    {p.percentageValue != null ? `${p.percentageValue}%` : formatBRL(p.fixedValue ?? 0)}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Installments Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Banknote className="w-4 h-4" /> Cronograma de Parcelas
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
                    <td className="p-3 text-right font-medium text-foreground">{formatBRL(inst.value)}</td>
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
