import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, Users, Calendar, TrendingUp, Building2, Shield, ExternalLink,
  Play, PieChart, Banknote, Clock, CheckCircle2, AlertCircle, CircleDollarSign,
  Percent, Timer, CreditCard, FileText, Share2, MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockStore, useMock, formatBRLFromReais } from "@/lib/mock-store";
import type { Campaign, CampaignInvestor, Installment } from "@/lib/mock-store";

const STATUS_MAP: Record<Campaign["status"], { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
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

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaigns = useMock(() => mockStore.getCampaigns());
  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h2 className="text-2xl font-bold text-foreground">Campanha não encontrada</h2>
        <Button asChild variant="outline"><Link to="/app/campanhas">Voltar às campanhas</Link></Button>
      </div>
    );
  }

  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  const minPct = Math.round((campaign.min_goal / campaign.goal) * 100);
  const raisedVsMin = Math.round((campaign.raised / campaign.min_goal) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.due_at).getTime() - Date.now()) / 86400000));
  const st = STATUS_MAP[campaign.status];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/campanhas")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">{campaign.name}</h1>
            <Badge variant={st.variant}>{st.label}</Badge>
            <Badge variant={campaign.modality === "equity" ? "default" : "secondary"} className="capitalize">
              {campaign.modality === "equity" ? "Equity" : "Dívida"}
            </Badge>
            {campaign.is_private && <Badge variant="outline">Privada</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{campaign.business_name} · {campaign.segment}</p>
        </div>
      </div>

      {/* Hero Banner */}
      {campaign.image_url && (
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden">
          <img src={campaign.image_url} alt={campaign.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white/80 text-sm">{campaign.segment}</p>
              <p className="text-white text-xl font-bold">{formatBRLFromReais(campaign.raised)} captados</p>
            </div>
            {campaign.promotional_video_url && (
              <a href={campaign.promotional_video_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary" className="gap-2"><Play className="w-4 h-4" /> Ver vídeo</Button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={TrendingUp} label="Captado" value={formatBRLFromReais(campaign.raised)} sub={`${pct}% da meta`} />
        <KPI icon={Users} label="Investidores" value={campaign.investors.toString()} sub={`${campaign.investor_list.filter((i) => i.status === "paid").length} confirmados`} />
        <KPI icon={Calendar} label="Prazo" value={daysLeft > 0 ? `${daysLeft} dias` : "Encerrada"} sub={new Date(campaign.due_at).toLocaleDateString("pt-BR")} />
        <KPI icon={PieChart} label="Cotas" value={`${campaign.total_quotas - campaign.available_quotas}/${campaign.total_quotas}`} sub={`${campaign.available_quotas} disponíveis`} />
      </div>

      {/* Fundraising Progress */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso da captação</span>
          <span className="text-sm text-muted-foreground">
            {campaign.fundraising_completion === "all_or_nothing" ? "Tudo ou nada" : "Flexível"}
          </span>
        </div>
        <div className="relative">
          <Progress value={pct} className="h-4" />
          {/* Min goal marker */}
          <div
            className="absolute top-0 h-4 border-l-2 border-dashed border-warning"
            style={{ left: `${minPct}%` }}
            title={`Meta mínima: ${formatBRLFromReais(campaign.min_goal)}`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatBRLFromReais(campaign.raised)} captados</span>
          <span>Meta mín. {formatBRLFromReais(campaign.min_goal)} ({raisedVsMin}%)</span>
          <span>Meta máx. {formatBRLFromReais(campaign.goal)}</span>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="investors">Investidores ({campaign.investor_list.length})</TabsTrigger>
          {campaign.debt && <TabsTrigger value="debt">Parcelas</TabsTrigger>}
          {campaign.equity && <TabsTrigger value="equity">Equity</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <OverviewTab campaign={campaign} />
        </TabsContent>

        <TabsContent value="investors" className="mt-4">
          <InvestorsTab investors={campaign.investor_list} quotaValue={campaign.quota_value} />
        </TabsContent>

        {campaign.debt && (
          <TabsContent value="debt" className="mt-4">
            <DebtTab campaign={campaign} />
          </TabsContent>
        )}

        {campaign.equity && (
          <TabsContent value="equity" className="mt-4">
            <EquityTab campaign={campaign} />
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

function OverviewTab({ campaign }: { campaign: Campaign }) {
  return (
    <>
      {/* Description + About */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border/60">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Descrição
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{campaign.description}</p>
            <Separator className="my-4" />
            <h3 className="font-semibold text-foreground mb-3">Sobre a empresa</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{campaign.about}</p>
          </Card>

          {/* Resource Utilization */}
          <Card className="p-6 border-border/60">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4" /> Destinação dos Recursos
            </h3>
            <p className="text-sm text-muted-foreground">{campaign.resource_utilization}</p>
          </Card>

          {/* Team */}
          <Card className="p-6 border-border/60">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Equipe
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {campaign.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <img src={m.avatar_url} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 border-border/60 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Detalhes da Oferta</h3>
            <DetailRow icon={Building2} label="Empresa" value={campaign.business_name} />
            <DetailRow icon={FileText} label="CNPJ" value={campaign.company_cnpj} />
            <DetailRow icon={CreditCard} label="Valor da cota" value={formatBRLFromReais(campaign.quota_value)} />
            <DetailRow icon={PieChart} label="Total de cotas" value={campaign.total_quotas.toString()} />
            <DetailRow icon={Shield} label="Garantia" value={formatBRLFromReais(campaign.warranty_amount)} />
            <DetailRow icon={Percent} label="Taxa Loor" value={`${campaign.loor_fee_percent}%`} />
            <DetailRow icon={Calendar} label="Abertura" value={campaign.opened_at ? new Date(campaign.opened_at).toLocaleDateString("pt-BR") : "—"} />
            <DetailRow icon={Calendar} label="Encerramento" value={new Date(campaign.due_at).toLocaleDateString("pt-BR")} />
            {campaign.modality === "equity" && campaign.equity && (
              <DetailRow icon={PieChart} label="Participação" value={`${campaign.equity.participation}%`} />
            )}
            {campaign.modality === "debt" && campaign.debt && (
              <>
                <DetailRow icon={Percent} label="Rentabilidade" value={`${campaign.debt.percentage_profitability}% a.a.`} />
                <DetailRow icon={Timer} label="Carência" value={`${campaign.debt.grace_period} meses`} />
                <DetailRow icon={Banknote} label="Parcelas" value={`${campaign.debt.total_installments}x`} />
                <DetailRow icon={Clock} label="Frequência" value={FREQ_MAP[campaign.debt.payment_frequency] ?? campaign.debt.payment_frequency} />
              </>
            )}
          </Card>

          {/* Actions */}
          <Card className="p-5 border-border/60 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Ações</h3>
            {campaign.whatsapp_group && (
              <a href={campaign.whatsapp_group} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <MessageCircle className="w-4 h-4" /> Grupo WhatsApp
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
            {campaign.promotional_video_url && (
              <a href={campaign.promotional_video_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" /> Vídeo promocional
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

function InvestorsTab({ investors, quotaValue }: { investors: CampaignInvestor[]; quotaValue: number }) {
  const [filter, setFilter] = useState<"all" | "paid" | "reserved">("all");
  const filtered = filter === "all" ? investors : investors.filter((i) => i.status === filter);
  const totalPaid = investors.filter((i) => i.status === "paid").reduce((s, i) => s + i.invested_amount, 0);
  const totalReserved = investors.filter((i) => i.status === "reserved").reduce((s, i) => s + i.invested_amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-border/60 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total investidores</p>
          <p className="text-2xl font-bold text-foreground">{investors.length}</p>
        </Card>
        <Card className="p-4 border-border/60 text-center">
          <p className="text-xs text-muted-foreground uppercase">Confirmados</p>
          <p className="text-2xl font-bold text-success">{formatBRLFromReais(totalPaid)}</p>
        </Card>
        <Card className="p-4 border-border/60 text-center">
          <p className="text-xs text-muted-foreground uppercase">Reservados</p>
          <p className="text-2xl font-bold text-warning-foreground">{formatBRLFromReais(totalReserved)}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "paid", "reserved"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "Todos" : f === "paid" ? "Confirmados" : "Reservados"}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Investidor</th>
                <th className="text-left p-3 font-medium text-muted-foreground">CPF</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Cotas</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-foreground">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.email}</p>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{inv.cpf_masked}</td>
                  <td className="p-3 text-right font-medium text-foreground">{inv.quotas}</td>
                  <td className="p-3 text-right font-medium text-foreground">{formatBRLFromReais(inv.invested_amount)}</td>
                  <td className="p-3 text-center">
                    <Badge variant={inv.status === "paid" ? "default" : "outline"} className="text-xs">
                      {inv.status === "paid" ? "Pago" : "Reservado"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">{new Date(inv.invested_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">Nenhum investidor encontrado</div>
        )}
      </Card>
    </div>
  );
}

/* ─── Debt Tab ─────────────────────────────────────────────────────────────── */

function DebtTab({ campaign }: { campaign: Campaign }) {
  const debt = campaign.debt!;
  const installments = debt.installments;
  const paid = installments.filter((i) => i.status === "paid");
  const pending = installments.filter((i) => i.status === "pending");
  const overdue = installments.filter((i) => i.status === "overdue");
  const totalPaid = paid.reduce((s, i) => s + i.amount, 0);
  const totalRemaining = pending.reduce((s, i) => s + i.amount, 0) + overdue.reduce((s, i) => s + i.amount, 0);
  const progressPct = installments.length > 0 ? Math.round((paid.length / installments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Debt Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs uppercase">Rentabilidade</span>
          </div>
          <p className="text-xl font-bold text-foreground">{debt.percentage_profitability}% a.a.</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase">Frequência</span>
          </div>
          <p className="text-xl font-bold text-foreground">{FREQ_MAP[debt.payment_frequency]}</p>
          <p className="text-xs text-muted-foreground">{debt.grace_period} meses de carência</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs uppercase">Pagas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{paid.length}/{installments.length}</p>
          <p className="text-xs text-muted-foreground">{formatBRLFromReais(totalPaid)}</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-warning-foreground mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs uppercase">Restante</span>
          </div>
          <p className="text-xl font-bold text-foreground">{pending.length + overdue.length}</p>
          <p className="text-xs text-muted-foreground">{formatBRLFromReais(totalRemaining)}</p>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso dos pagamentos</span>
          <span className="text-sm text-muted-foreground">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{paid.length} pagas</span>
          {overdue.length > 0 && <span className="text-destructive">{overdue.length} em atraso</span>}
          <span>{pending.length} pendentes</span>
        </div>
      </Card>

      {/* Installments table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Nº</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Vencimento</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Pago em</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((inst) => (
                <tr key={inst.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{inst.number}ª parcela</td>
                  <td className="p-3 text-right font-medium text-foreground">{formatBRLFromReais(inst.amount)}</td>
                  <td className="p-3 text-right text-muted-foreground">{new Date(inst.due_date).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="p-3 text-center">
                    <InstallmentStatusBadge status={inst.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function InstallmentStatusBadge({ status }: { status: Installment["status"] }) {
  if (status === "paid") return <Badge className="bg-success text-success-foreground hover:bg-success text-xs">Paga</Badge>;
  if (status === "overdue") return <Badge variant="destructive" className="text-xs">Em atraso</Badge>;
  return <Badge variant="outline" className="text-xs">Pendente</Badge>;
}

/* ─── Equity Tab ───────────────────────────────────────────────────────────── */

function EquityTab({ campaign }: { campaign: Campaign }) {
  const eq = campaign.equity!;
  const paidInvestors = campaign.investor_list.filter((i) => i.status === "paid");
  const totalPaidQuotas = paidInvestors.reduce((s, i) => s + i.quotas, 0);
  const capTable = paidInvestors.map((inv) => ({
    ...inv,
    ownership_pct: (inv.quotas / campaign.total_quotas) * eq.participation,
  }));

  return (
    <div className="space-y-6">
      {/* Equity KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <PieChart className="w-4 h-4" />
            <span className="text-xs uppercase">Participação total</span>
          </div>
          <p className="text-xl font-bold text-foreground">{eq.participation}%</p>
          <p className="text-xs text-muted-foreground">da empresa ofertada</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Banknote className="w-4 h-4" />
            <span className="text-xs uppercase">Valuation implícito</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {formatBRLFromReais(Math.round(campaign.goal / (eq.participation / 100)))}
          </p>
          <p className="text-xs text-muted-foreground">pre-money</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs uppercase">Cotas vendidas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalPaidQuotas}</p>
          <p className="text-xs text-muted-foreground">de {campaign.total_quotas}</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase">Sócios investidores</span>
          </div>
          <p className="text-xl font-bold text-foreground">{paidInvestors.length}</p>
          <p className="text-xs text-muted-foreground">confirmados</p>
        </Card>
      </div>

      {/* Ownership visualization */}
      <Card className="p-6 border-border/60">
        <h3 className="font-semibold text-foreground mb-4">Distribuição da Participação</h3>
        <div className="flex h-8 rounded-full overflow-hidden bg-muted/50 mb-4">
          <div
            className="bg-primary transition-all"
            style={{ width: `${100 - eq.participation}%` }}
            title={`Fundadores: ${(100 - eq.participation).toFixed(1)}%`}
          />
          <div
            className="bg-accent transition-all"
            style={{ width: `${(totalPaidQuotas / campaign.total_quotas) * eq.participation}%` }}
            title={`Investidores: ${((totalPaidQuotas / campaign.total_quotas) * eq.participation).toFixed(2)}%`}
          />
          <div
            className="bg-muted transition-all"
            style={{ width: `${((campaign.available_quotas) / campaign.total_quotas) * eq.participation}%` }}
            title="Disponível"
          />
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> Fundadores ({(100 - eq.participation).toFixed(1)}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent" /> Investidores ({((totalPaidQuotas / campaign.total_quotas) * eq.participation).toFixed(2)}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-muted" /> Disponível ({((campaign.available_quotas / campaign.total_quotas) * eq.participation).toFixed(2)}%)</span>
        </div>
      </Card>

      {/* Cap Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Cap Table (Investidores Confirmados)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Investidor</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Cotas</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Investido</th>
                <th className="text-right p-3 font-medium text-muted-foreground">% Participação</th>
              </tr>
            </thead>
            <tbody>
              {capTable.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-foreground">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.cpf_masked}</p>
                  </td>
                  <td className="p-3 text-right font-medium text-foreground">{inv.quotas}</td>
                  <td className="p-3 text-right font-medium text-foreground">{formatBRLFromReais(inv.invested_amount)}</td>
                  <td className="p-3 text-right font-medium text-foreground">{inv.ownership_pct.toFixed(3)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
