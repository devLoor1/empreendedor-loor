import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignCreateButton } from "@/components/campaign-launch-guard";
import { EmptyState } from "@/components/empty-state";
import { Users, Calendar, TrendingUp, CheckCircle2, Archive, Megaphone, type LucideIcon } from "lucide-react";
import {
  getActiveOpportunities,
  getReviewOpportunities,
  getArchivedOpportunities,
  getFinishedOpportunities,
} from "@/services/api";

type GoalData = {
  confirmed_payment: number;
  confirmed_payment_percentage: number;
  unconfirmed_payment: number;
  max_goal: number;
  min_goal: number;
  percentage_awaiting_payment: number;
};

type ActiveOpp = {
  id: number;
  due_at: string;
  modality: string;
  name: string;
  segment: string;
  total_investors: number;
  goal: GoalData;
};

type SimpleOpp = {
  id: number;
  name: string;
  segment: string;
  modality: string;
  image?: string;
  created_at?: string;
  end_at?: string;
  reason_for_archiving?: string | null;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CampaignsPage() {
  const [active, setActive] = useState<ActiveOpp[]>([]);
  const [review, setReview] = useState<SimpleOpp[]>([]);
  const [archived, setArchived] = useState<SimpleOpp[]>([]);
  const [finished, setFinished] = useState<SimpleOpp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getActiveOpportunities().catch(() => ({ data: [] })),
      getReviewOpportunities().catch(() => ({ data: [] })),
      getArchivedOpportunities().catch(() => ({ data: [] })),
      getFinishedOpportunities().catch(() => ({ data: [] })),
    ]).then(([act, rev, arc, fin]) => {
      setActive(act?.data ?? []);
      setReview(rev?.data ?? []);
      setArchived(arc?.data ?? []);
      setFinished(fin?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const total = active.length + review.length + archived.length + finished.length;

  if (loading) return <CampaignsSkeleton />;

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground mt-1">Gerencie e acompanhe todas as suas campanhas de captação.</p>
        </div>
        <CampaignCreateButton />
      </header>

      {active.length > 0 && (
        <section className="space-y-3">
          <SectionTitle icon={TrendingUp} title="Ativas" count={active.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((c) => {
              const paidPct = Math.min(c.goal.confirmed_payment_percentage, 100);
              const pendingPct = Math.min(c.goal.percentage_awaiting_payment, 100 - paidPct);
              return (
                <Link key={c.id} to={`/app/campanhas/${c.id}`} className="block group">
                  <Card className="p-5 border-border/60 hover:shadow-[var(--shadow-elegant)] transition-all group-hover:-translate-y-0.5 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">{c.name}</h3>
                        <p className="text-xs text-muted-foreground">{c.segment}</p>
                      </div>
                      <Badge variant={c.modality === "equity" ? "default" : "secondary"} className="capitalize shrink-0">
                        {c.modality === "equity" ? "Equity" : "Dívida"}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Meta mín: {formatBRL(c.goal.min_goal)}</span>
                        <span>Meta máx: {formatBRL(c.goal.max_goal)}</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: `${paidPct}%` }} />
                        <div className="absolute top-0 h-full bg-primary/30 rounded-full" style={{ left: `${paidPct}%`, width: `${pendingPct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-primary font-medium">{formatBRL(c.goal.confirmed_payment)} ({paidPct.toFixed(1)}%)</span>
                        <span className="text-muted-foreground">{formatBRL(c.goal.unconfirmed_payment)} pend.</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {c.total_investors} investidores</div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(c.due_at).toLocaleDateString("pt-BR")}</div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {review.length > 0 && (
        <section className="space-y-3">
          <SectionTitle icon={Calendar} title="Em análise" count={review.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {review.map((c) => (
              <Link key={c.id} to={`/app/campanhas/${c.id}`} className="block group">
                <Card className="p-5 border-border/60 hover:shadow-[var(--shadow-elegant)] transition-all group-hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.segment}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize shrink-0">
                      {c.modality === "equity" ? "Equity" : "Dívida"}
                    </Badge>
                  </div>
                  {c.created_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Submetida em {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section className="space-y-3">
          <SectionTitle icon={CheckCircle2} title="Concluídas" count={finished.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finished.map((c) => (
              <Link key={c.id} to={`/app/campanhas/${c.id}`} className="block group">
                <Card className="p-5 border-border/60 hover:shadow-[var(--shadow-elegant)] transition-all group-hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.segment}</p>
                    </div>
                    <Badge className="capitalize shrink-0 bg-success text-success-foreground hover:bg-success">
                      {c.modality === "equity" ? "Equity" : "Dívida"}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section className="space-y-3">
          <SectionTitle icon={Archive} title="Arquivadas" count={archived.length} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archived.map((c) => (
              <Link key={c.id} to={`/app/campanhas/${c.id}`} className="block group">
                <Card className="p-5 border-border/60 opacity-70 hover:opacity-100 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.segment}</p>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">Arquivada</Badge>
                  </div>
                  {c.reason_for_archiving && (
                    <p className="text-xs text-muted-foreground mt-2">{c.reason_for_archiving}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha criada ainda"
          description="Sua listagem fica vazia até a primeira oportunidade ser enviada. Use a criação guiada para revisar pré-requisitos e preparar os dados com segurança."
          action={<CampaignCreateButton />}
        />
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, count }: { icon: LucideIcon; title: string; count: number }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
      <Icon className="w-5 h-5" /> {title} <span className="text-muted-foreground font-normal text-sm">({count})</span>
    </h2>
  );
}

function CampaignsSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl">
      <Skeleton className="h-10 w-48" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>
    </div>
  );
}
