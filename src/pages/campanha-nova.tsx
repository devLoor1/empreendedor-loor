import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  FileText,
  LockKeyhole,
  Megaphone,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CampaignCreationStatusCard,
  CampaignPrerequisiteList,
} from "@/components/campaign-launch-guard";
import { getBlockingPrerequisites, useCampaignReadiness } from "@/hooks/use-campaign-readiness";

const DRAFT_STEPS = [
  "Dados da oportunidade",
  "Modelo de captação",
  "Documentos e garantias",
  "Revisão para análise",
];

export default function CampaignCreatePage() {
  const readiness = useCampaignReadiness();
  const blocking = getBlockingPrerequisites(readiness.items);
  const canStart = !readiness.loading && blocking.length === 0;

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
            <Link to="/app/campanhas">
              <ArrowLeft className="h-4 w-4" />
              Campanhas
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nova campanha</h1>
            <p className="mt-1 text-muted-foreground">
              Revise a elegibilidade antes de iniciar uma oportunidade.
            </p>
          </div>
        </div>
        <CampaignCreationStatusCard />
      </header>

      {!canStart && (
        <Alert
          variant={blocking.some((item) => item.status === "blocked") ? "destructive" : "default"}
        >
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Campanha ainda não liberada</AlertTitle>
          <AlertDescription>
            Resolva os itens pendentes antes de avançar para a criação da oportunidade.
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pré-requisitos</h2>
          <p className="text-sm text-muted-foreground">
            A verificação usa somente dados já disponíveis para esta área.
          </p>
        </div>
        <CampaignPrerequisiteList items={readiness.items} loading={readiness.loading} />
      </section>

      {canStart && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Estrutura inicial</h2>
            <p className="text-sm text-muted-foreground">
              As próximas etapas ficam preparadas para o fluxo completo de criação.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {DRAFT_STEPS.map((step, index) => (
              <Card key={step} className="border-border/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {index === 0 ? (
                      <Megaphone className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{step}</h3>
                      <Badge variant="secondary">Próxima etapa</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Disponível quando o formulário completo da campanha for liberado.
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>
              <LockKeyhole className="h-4 w-4" />
              Continuar criação
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/campanhas">Voltar para campanhas</Link>
            </Button>
          </div>
        </section>
      )}

      {!readiness.loading && blocking.length === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Elegibilidade visual concluída</AlertTitle>
          <AlertDescription>
            Nenhuma campanha será criada até o fluxo completo ser confirmado.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
