import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Presentation,
  SquareKanban,
  Target,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const tools = [
  {
    title: "Kanban",
    description: "Organize tarefas da operação em colunas conectadas ao contrato real de tarefas.",
    href: "/app/ferramentas/kanban",
    icon: SquareKanban,
    status: "Disponível",
  },
  {
    title: "Pitch Deck",
    description: "Preencha, gere e revise o texto do pitch deck usando os endpoints reais do empreendedor.",
    href: "/app/ferramentas/pitch-deck",
    icon: Presentation,
    status: "Disponível",
  },
] as const;

const upcoming = [
  {
    title: "Métricas",
    description: "Indicadores operacionais serão ativados quando houver contrato dedicado.",
    icon: BarChart3,
  },
  {
    title: "Metas",
    description: "Acompanhamento de objetivos fica reservado para o ciclo de contrato apropriado.",
    icon: Target,
  },
  {
    title: "Agenda",
    description: "Compromissos e lembretes permanecem em breve, sem dados simulados.",
    icon: CalendarClock,
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="max-w-6xl space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Wrench className="h-3.5 w-3.5 text-primary" />
          Ferramentas do empreendedor
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Ferramentas</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Área operacional para organizar tarefas e preparar materiais de apoio à captação. Apenas
            módulos com contrato backend confirmado estão ativos.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;

          return (
            <Card key={tool.title} className="border-border/60 p-5 shadow-[var(--shadow-soft)]">
              <div className="flex h-full min-w-0 flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">{tool.title}</h2>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                        {tool.status}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="mt-auto">
                  <Button asChild>
                    <Link to={tool.href}>
                      Abrir {tool.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Próximos módulos</h2>
          <p className="text-sm text-muted-foreground">
            Estes cards existem apenas como orientação de roadmap. Não há dados fictícios ou ações
            simuladas.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {upcoming.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="border-dashed border-border/70 bg-muted/20 p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
