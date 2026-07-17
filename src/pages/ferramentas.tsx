import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Loader2,
  LockKeyhole,
  Presentation,
  RefreshCw,
  SquareKanban,
  Target,
  Wrench,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEntrepreneurTools } from "@/hooks/use-entrepreneur-tools";
import type { EntrepreneurToolKey } from "@/services/api";

const tools = [
  {
    key: "kanban",
    title: "Kanban",
    description: "Organize tarefas da operação em colunas conectadas ao contrato real de tarefas.",
    href: "/app/ferramentas/kanban",
    icon: SquareKanban,
  },
  {
    key: "pitch_deck",
    title: "Pitch Deck",
    description: "Preencha, gere e revise o texto do pitch deck usando os endpoints reais do empreendedor.",
    href: "/app/ferramentas/pitch-deck",
    icon: Presentation,
  },
] as const satisfies ReadonlyArray<{
  key: EntrepreneurToolKey;
  title: string;
  description: string;
  href: string;
  icon: typeof Wrench;
}>;

const upcoming = [
  {
    key: "metrics",
    title: "Métricas",
    description: "Indicadores operacionais serão ativados quando houver contrato dedicado.",
    icon: BarChart3,
  },
  {
    key: "goals",
    title: "Metas",
    description: "Acompanhamento de objetivos fica reservado para o ciclo de contrato apropriado.",
    icon: Target,
  },
  {
    key: "agenda",
    title: "Agenda",
    description: "Compromissos e lembretes permanecem em breve, sem dados simulados.",
    icon: CalendarClock,
  },
] as const satisfies ReadonlyArray<{
  key: EntrepreneurToolKey;
  title: string;
  description: string;
  icon: typeof Wrench;
}>;

export default function ToolsPage() {
  const {
    getAccessState,
    getTool,
    isEmpty,
    isError,
    isFetching,
    unknownTools,
    refresh,
  } = useEntrepreneurTools();

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          A disponibilidade é definida pelo administrador para esta conta.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refresh()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar acesso
        </Button>
      </div>

      {(isError || isEmpty) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível confirmar as ferramentas disponíveis</AlertTitle>
          <AlertDescription>
            Por segurança, os módulos permanecem bloqueados. Tente atualizar o acesso antes de
            continuar.
          </AlertDescription>
        </Alert>
      )}

      {unknownTools.length > 0 && (
        <Alert>
          <Wrench className="h-4 w-4" />
          <AlertTitle>Novas configurações detectadas</AlertTitle>
          <AlertDescription>
            Existem ferramentas ainda não reconhecidas por esta versão da interface. Os módulos
            conhecidos continuam disponíveis conforme a configuração administrativa.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const accessState = getAccessState(tool.key);
          const configuredTool = getTool(tool.key);
          const isEnabled = accessState === "enabled";
          const isDisabled = accessState === "disabled";

          return (
            <Card key={tool.title} className="border-border/60 p-5 shadow-[var(--shadow-soft)]">
              <div className="flex h-full min-w-0 flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    {isDisabled ? <LockKeyhole className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">
                        {configuredTool?.label ?? tool.title}
                      </h2>
                      <Badge
                        variant={isEnabled ? "default" : "outline"}
                        className={isEnabled ? "bg-primary/10 text-primary hover:bg-primary/10" : undefined}
                      >
                        {accessState === "loading"
                          ? "Verificando acesso"
                          : isEnabled
                            ? "Disponível"
                            : isDisabled
                              ? "Desabilitada pelo administrador"
                              : "Acesso indisponível"}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="mt-auto">
                  {isEnabled ? (
                    <Button asChild>
                      <Link to={tool.href}>
                        Abrir {tool.title}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" disabled>
                      {accessState === "loading" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LockKeyhole className="h-4 w-4" />
                      )}
                      {accessState === "loading"
                        ? "Verificando acesso"
                        : isDisabled
                          ? "Acesso desabilitado"
                          : "Acesso indisponível"}
                    </Button>
                  )}
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
            const accessState = getAccessState(item.key);
            const configuredTool = getTool(item.key);
            const isDisabled = accessState === "disabled";

            return (
              <Card key={item.title} className="border-dashed border-border/70 bg-muted/20 p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                      {isDisabled ? <LockKeyhole className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <Badge variant="outline">
                      {accessState === "loading"
                        ? "Verificando acesso"
                        : accessState === "enabled"
                          ? "Em breve"
                          : isDisabled
                            ? "Desabilitada pelo administrador"
                            : "Acesso indisponível"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">
                      {configuredTool?.label ?? item.title}
                    </h3>
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
