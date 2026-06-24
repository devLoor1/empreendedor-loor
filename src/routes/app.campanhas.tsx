import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, TrendingUp, Plus, Lock } from "lucide-react";
import { mockStore, useMock, formatBRLFromReais } from "@/lib/mock-store";

export const Route = createFileRoute("/app/campanhas")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const campaigns = useMock(() => mockStore.getCampaigns());
  const company = useMock(() => mockStore.getCompany());
  const personal = useMock(() => mockStore.getPersonal());
  const docs = useMock(() => mockStore.getDocs());
  const docsDone = docs.filter((d) => d.required).every((d) => d.status !== "missing");
  const canCreate = !!company && !!personal && docsDone;

  const active = campaigns.filter((c) => c.status === "active");

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campanhas em aberto</h1>
          <p className="text-muted-foreground mt-1">Acompanhe as oportunidades disponíveis na plataforma.</p>
        </div>
        <Button disabled={!canCreate} className="gap-2" onClick={() => canCreate ? null : null}>
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((c) => {
          const pct = Math.round((c.raised / c.goal) * 100);
          return (
            <Card key={c.id} className="p-5 border-border/60 hover:shadow-[var(--shadow-elegant)] transition-shadow flex flex-col">
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
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <TrendingUp className="w-4 h-4" /> Ver detalhes
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}