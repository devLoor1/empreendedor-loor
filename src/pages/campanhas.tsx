import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, TrendingUp, Plus, Lock, CheckCircle2, Archive } from "lucide-react";
import { mockStore, useMock, formatBRLFromReais } from "@/lib/mock-store";

export default function CampaignsPage() {
  const campaigns = useMock(() => mockStore.getCampaigns());
  const company = useMock(() => mockStore.getCompany());
  const personal = useMock(() => mockStore.getPersonal());
  const docs = useMock(() => mockStore.getDocs());
  const docsDone = docs.filter((d) => d.required).every((d) => d.status !== "missing");
  const canCreate = !!company && !!personal && docsDone;

  const active = campaigns.filter((c) => c.status === "active");
  const finished = campaigns.filter((c) => c.status === "finished");
  const review = campaigns.filter((c) => c.status === "review");
  const archived = campaigns.filter((c) => c.status === "archived");

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground mt-1">Gerencie e acompanhe todas as suas campanhas de captação.</p>
        </div>
        <Button disabled={!canCreate} className="gap-2">
          {canCreate ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {canCreate ? "Nova campanha" : "Complete o cadastro"}
        </Button>
      </header>

      {!canCreate && (
        <Card className="p-4 border-warning/40 bg-warning/10 text-sm flex items-center justify-between gap-4 flex-wrap">
          <span className="text-foreground">Para criar uma campanha conforme a CVM 88, complete perfil, dados pessoais e documentação.</span>
          <Button asChild size="sm" variant="outline"><Link to="/app/dashboard">Ver pendências</Link></Button>
        </Card>
      )}

      {active.length > 0 && (
        <CampaignSection icon={TrendingUp} title="Ativas" campaigns={active} />
      )}

      {review.length > 0 && (
        <CampaignSection icon={Calendar} title="Em análise" campaigns={review} />
      )}

      {finished.length > 0 && (
        <CampaignSection icon={CheckCircle2} title="Concluídas" campaigns={finished} />
      )}

      {archived.length > 0 && (
        <CampaignSection icon={Archive} title="Arquivadas" campaigns={archived} />
      )}

      {campaigns.length === 0 && (
        <Card className="p-10 text-center border-border/60">
          <p className="text-muted-foreground">Nenhuma campanha criada ainda.</p>
        </Card>
      )}
    </div>
  );
}

function CampaignSection({ icon: Icon, title, campaigns }: { icon: any; title: string; campaigns: ReturnType<typeof mockStore.getCampaigns> }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
        <Icon className="w-5 h-5" /> {title} ({campaigns.length})
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => {
          const pct = Math.round((c.raised / c.goal) * 100);
          return (
            <Link key={c.id} to={`/app/campanhas/${c.id}`} className="block group">
              <Card className="p-5 border-border/60 hover:shadow-[var(--shadow-elegant)] transition-all group-hover:-translate-y-0.5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.segment}</p>
                  </div>
                  <Badge variant={c.modality === "equity" ? "default" : "secondary"} className="capitalize">
                    {c.modality === "equity" ? "Equity" : "Dívida"}
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{formatBRLFromReais(c.raised)}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">Meta {formatBRLFromReais(c.goal)}</div>
                </div>
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-3.5 h-3.5" /> {c.investors} investidores</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> {new Date(c.due_at).toLocaleDateString("pt-BR")}</div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 gap-2 pointer-events-none">
                  <TrendingUp className="w-4 h-4" /> Ver detalhes
                </Button>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
