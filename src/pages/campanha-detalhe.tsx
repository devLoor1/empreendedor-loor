import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Users, Calendar, TrendingUp, Building2, Shield, ExternalLink,
  Play, PieChart, Banknote, Clock, CheckCircle2, AlertCircle, CircleDollarSign,
  Percent, Timer, CreditCard, FileText, Share2, MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getOpportunity, getOpportunityInvestors } from "@/services/api";

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
  created_at: string;
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

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
  const daysLeft = opp.due_at ? Math.max(0, Math.ceil((new Date(opp.due_at).getTime() - Date.now()) / 86400000)) : 0;
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
              <p className="text-white text-xl font-bold">{formatBRL(opp.goal.confirmed_payment)} captados</p>
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
        <KPI icon={TrendingUp} label="Captado" value={formatBRL(opp.goal.confirmed_payment)} sub={`${paidPct.toFixed(1)}% da meta`} />
        <KPI icon={Users} label="Investidores" value={totalInvestors.toString()} sub={`${opp.total_investors} identificados · ${anonymous} anônimos`} />
        <KPI icon={Calendar} label="Prazo" value={daysLeft > 0 ? `${daysLeft} dias` : "Encerrada"} sub={opp.due_at ? new Date(opp.due_at).toLocaleDateString("pt-BR") : "—"} />
        <KPI icon={CreditCard} label="Valor da cota" value={formatBRL(quotaValue)} sub={`Pend: ${formatBRL(opp.goal.unconfirmed_payment)}`} />
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
            title={`Meta mínima: ${formatBRL(opp.goal.min_goal)}`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatBRL(opp.goal.confirmed_payment)} confirmados</span>
          <span>Meta mín. {formatBRL(opp.goal.min_goal)} ({raisedVsMin}%)</span>
          <span>Meta máx. {formatBRL(opp.goal.max_goal)}</span>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="investors">Investidores ({totalInvestors})</TabsTrigger>
          {opp.debt && <TabsTrigger value="debt">Dívida</TabsTrigger>}
          {opp.equity && <TabsTrigger value="equity">Equity</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <OverviewTab opp={opp} />
        </TabsContent>

        <TabsContent value="investors" className="mt-4">
          <InvestorsTab investors={investors} anonymous={anonymous} />
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

/* ─── KPI Card ─────────────────────────────────────────────────────────────── */

function KPI({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
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
                <h3 className="font-semibold text-foreground mb-3">Sobre a empresa</h3>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 border-border/60 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Detalhes da Oferta</h3>
            <DetailRow icon={Building2} label="Empresa" value={opp.business_name} />
            {opp.company_cnpj && <DetailRow icon={FileText} label="CNPJ" value={opp.company_cnpj} />}
            <DetailRow icon={CreditCard} label="Valor da cota" value={formatBRL(opp.monetary.min_investment_value)} />
            <DetailRow icon={Shield} label="Garantia" value={formatBRL(opp.monetary.warranty_amount)} />
            <DetailRow icon={Calendar} label="Abertura" value={opp.created_at ? new Date(opp.created_at).toLocaleDateString("pt-BR") : "—"} />
            <DetailRow icon={Calendar} label="Encerramento" value={opp.due_at ? new Date(opp.due_at).toLocaleDateString("pt-BR") : "—"} />
            {opp.modality === "equity" && opp.equity && (
              <DetailRow icon={PieChart} label="Participação" value={`${opp.equity.participation}%`} />
            )}
            {opp.modality === "debt" && opp.debt && (
              <>
                <DetailRow icon={Percent} label="Rentabilidade" value={`${opp.debt.percentage_profitability ?? "—"}% a.a.`} />
                <DetailRow icon={Timer} label="Carência" value={`${opp.debt.grace_period ?? "—"} meses`} />
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

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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
          <p className="text-2xl font-bold text-success">{formatBRL(totalInvested)}</p>
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
                  <td className="p-3 text-right font-medium text-foreground">{formatBRL(inv.total_invested)}</td>
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
          <p className="text-xl font-bold text-foreground">{formatBRL(valuation)}</p>
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
                    <td className="p-3 text-right font-medium text-foreground">{formatBRL(inv.total_invested)}</td>
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
