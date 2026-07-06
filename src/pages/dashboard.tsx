import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getHome } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileCheck2, Megaphone, TrendingUp, Users, BarChart3 } from "lucide-react";

type Opportunity = {
  name: string;
  due_at: string;
  confirmed_payment: number;
  confirmed_payment_percentage: number;
  unconfirmed_payment: number;
  max_goal: number;
  min_goal: number;
  percentage_awaiting_payment: number;
};

type Investment = {
  month: number;
  total_invested: number;
};

type HomeData = {
  active_opportunities: number;
  total_investors: number;
  total_invested: number;
  income: number;
  opportunities: Opportunity[];
  investments: Investment[];
};

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHome()
      .then((res) => setData(res.data))
      .catch(() => setError("Não foi possível carregar os dados do dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const monthlyMap: Record<number, number> = {};
  data?.investments.forEach(({ month, total_invested }) => {
    monthlyMap[month] = (monthlyMap[month] ?? 0) + total_invested;
  });
  const maxMonthly = Math.max(...Object.values(monthlyMap), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.full_name?.split(" ")[0] ?? "Empreendedor"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Aqui está o panorama da sua jornada de captação.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Campanhas ativas" value={String(data?.active_opportunities ?? 0)} icon={Megaphone} />
        <Stat label="Total captado" value={formatBRL(data?.total_invested ?? 0)} icon={TrendingUp} />
        <Stat label="Investidores" value={String(data?.total_investors ?? 0)} icon={Users} />
      </div>

      {(data?.opportunities?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Campanhas ativas</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {data!.opportunities.map((opp) => (
              <OpportunityCard key={opp.name} opp={opp} />
            ))}
          </div>
        </section>
      )}

      {(data?.opportunities?.length ?? 0) === 0 && (
        <Card className="p-6 border-border/60 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-foreground">Nenhuma campanha ativa</h3>
          <p className="text-sm text-muted-foreground">
            Complete seu perfil e documentação para lançar sua primeira campanha.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/app/perfil-empresa" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Building2 className="w-4 h-4" /> Perfil da empresa
            </Link>
            <Link to="/app/documentos" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <FileCheck2 className="w-4 h-4" /> Documentos CVM 88
            </Link>
          </div>
        </Card>
      )}

      {Object.keys(monthlyMap).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Captação mensal ({new Date().getFullYear()})
          </h2>
          <Card className="p-6 border-border/60">
            <div className="flex items-end gap-2 h-36">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const val = monthlyMap[m] ?? 0;
                const pct = (val / maxMonthly) * 100;
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors relative"
                      style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                      title={val > 0 ? formatBRL(val) : undefined}
                    />
                    <span className="text-[10px] text-muted-foreground">{MONTHS[m - 1]}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const paidPct = Math.min(opp.confirmed_payment_percentage, 100);
  const pendingPct = Math.min(opp.percentage_awaiting_payment, 100 - paidPct);
  const dueDate = opp.due_at ? new Date(opp.due_at).toLocaleDateString("pt-BR") : "—";

  return (
    <Card className="p-5 border-border/60 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground leading-tight">{opp.name}</h3>
        <Badge variant="outline" className="shrink-0 text-xs">Ativa</Badge>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Meta mínima: {formatBRL(opp.min_goal)}</span>
          <span>Meta máxima: {formatBRL(opp.max_goal)}</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: `${paidPct}%` }} />
          <div className="absolute top-0 h-full bg-primary/30 rounded-full" style={{ left: `${paidPct}%`, width: `${pendingPct}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-primary font-medium">{formatBRL(opp.confirmed_payment)} confirmado ({paidPct.toFixed(1)}%)</span>
          <span className="text-muted-foreground">{formatBRL(opp.unconfirmed_payment)} pendente</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Encerramento: {dueDate}</p>
    </Card>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card className="p-5 border-border/60 flex items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-xl font-semibold text-foreground">{value}</div>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    </div>
  );
}
