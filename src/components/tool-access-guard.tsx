import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, LockKeyhole, RefreshCw, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEntrepreneurTools } from "@/hooks/use-entrepreneur-tools";
import type { EntrepreneurToolKey } from "@/services/api";

export function ToolAccessGuard({
  toolKey,
  label,
  children,
}: {
  toolKey: EntrepreneurToolKey;
  label: string;
  children: ReactNode;
}) {
  const { getAccessState, getTool, isFetching, refresh } = useEntrepreneurTools();
  const accessState = getAccessState(toolKey);
  const tool = getTool(toolKey);

  if (accessState === "enabled") return <>{children}</>;

  const isLoading = accessState === "loading";
  const isDisabled = accessState === "disabled";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground">
        <Link to="/app/ferramentas">
          <ArrowLeft className="h-4 w-4" />
          Ferramentas
        </Link>
      </Button>

      <Card className="border-border/70 p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isDisabled ? (
                <LockKeyhole className="h-5 w-5" />
              ) : (
                <Wrench className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <Badge variant="outline">
                {isLoading
                  ? "Verificando acesso"
                  : isDisabled
                    ? "Desabilitada pelo administrador"
                    : "Acesso indisponível"}
              </Badge>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{tool?.label ?? label}</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {isLoading
                    ? "Aguarde enquanto confirmamos se esta ferramenta está disponível para sua conta."
                    : isDisabled
                      ? "Esta ferramenta foi desabilitada pelo administrador. Entre em contato com o suporte responsável se precisar recuperar o acesso."
                      : "Não foi possível confirmar a permissão desta ferramenta. Por segurança, nenhum dado protegido foi carregado."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isLoading && !isDisabled && (
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
                Tentar novamente
              </Button>
            )}
            <Button asChild variant={isLoading ? "outline" : "default"}>
              <Link to="/app/ferramentas">Voltar para Ferramentas</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
