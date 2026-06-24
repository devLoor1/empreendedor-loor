import { createFileRoute, Link } from "@tanstack/react-router";
import { mockStore, useMock, formatBRLFromReais } from "@/lib/mock-store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, FileCheck2, Megaphone, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const user = useMock(() => mockStore.getUser());
  const company = useMock(() => mockStore.getCompany());
  const personal = useMock(() => mockStore.getPersonal());
  const docs = useMock(() => mockStore.getDocs());
  const campaigns = useMock(() => mockStore.getCampaigns());

  const required = docs.filter((d) => d.required);
  const done = required.filter((d) => d.status !== "missing").length;
  const docPct = Math.round((done / required.length) * 100);
  const companyPct = company ? 100 : 0;
  const personalPct = personal ? 100 : 0;
  const readiness = Math.round((docPct + companyPct + personalPct) / 3);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const totalRaised = activeCampaigns.reduce((s, c) => s + c.raised, 0);

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Olá, {user?.full_name?.split(" ")[0] ?? "Empreendedor"} 👋</h1>
        <p className="text-muted-foreground mt-1">Aqui está o panorama da sua jornada de captação.</p>
      </header>

      <Card className="p-6 border-border/60" style={{ background: "var(--gradient-subtle)" }}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <Badge variant="secondary" className="mb-2">Prontidão para captação</Badge>
            <h2 className="text-2xl font-semibold text-foreground">Você está {readiness}% pronto para lançar uma campanha</h2>
            <p className="text-sm text-muted-foreground mt-1">Complete os passos abaixo para atender à regulamentação CVM 88.</p>
          </div>
          <div className="w-full md:w-72">
            <Progress value={readiness} className="h-3" />
            <div className="mt-2 text-xs text-muted-foreground flex justify-between"><span>0%</span><span>100%</span></div>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StepCard to="/app/perfil-empresa" icon={Building2} title="Perfil da empresa" pct={companyPct} done={!!company} hint={company ? company.business_name : "Buscar dados via CNPJ"} />
        <StepCard to="/app/perfil-pessoal" icon={Megaphone} title="Perfil pessoal" pct={personalPct} done={!!personal} hint={personal ? personal.full_name : "Preencher dados do responsável"} />
        <StepCard to="/app/documentos" icon={FileCheck2} title="Documentos CVM 88" pct={docPct} done={docPct === 100} hint={`${done} de ${required.length} obrigatórios`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Stat label="Campanhas ativas" value={activeCampaigns.length.toString()} icon={Megaphone} />
        <Stat label="Total captado" value={formatBRLFromReais(totalRaised)} icon={TrendingUp} />
        <Stat label="Investidores" value={activeCampaigns.reduce((s, c) => s + c.investors, 0).toString()} icon={CheckCircle2} />
      </div>

      {readiness < 100 && (
        <Card className="p-5 border-warning/40 bg-warning/10 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-foreground/80 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Sua conta ainda não está pronta para captação</h3>
            <p className="text-sm text-muted-foreground mt-1">Segundo a Resolução CVM 88, você precisa completar perfil da empresa, perfil pessoal e enviar a documentação obrigatória.</p>
          </div>
          <Button asChild size="sm"><Link to="/app/documentos">Continuar</Link></Button>
        </Card>
      )}
    </div>
  );
}

function StepCard({ to, icon: Icon, title, pct, done, hint }: { to: string; icon: any; title: string; pct: number; done: boolean; hint: string }) {
  return (
    <Link to={to} className="block group">
      <Card className="p-5 h-full border-border/60 transition-all group-hover:shadow-[var(--shadow-elegant)] group-hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
            <Icon className="w-5 h-5" />
          </div>
          {done ? <Badge className="bg-success text-success-foreground hover:bg-success">Completo</Badge> : <Badge variant="outline">Pendente</Badge>}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-3 truncate">{hint}</p>
        <Progress value={pct} className="h-1.5" />
      </Card>
    </Link>
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