import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { appLogoAlt, appLogoUrl } from "@/config/brand";
import { isAuthenticated } from "@/hooks/use-auth";
import { confirmRegister } from "@/services/api";

type ConfirmationState = "loading" | "success" | "already-confirmed" | "error";

export default function VerificationEmailPage() {
  const { token } = useParams();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [message, setMessage] = useState("");
  const hasSession = isAuthenticated();

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("O link de confirmação está incompleto.");
      return;
    }

    let active = true;

    confirmRegister(token)
      .then((response) => {
        if (!active) return;
        const alreadyConfirmed = Boolean(response?.data?.user_has_already_been_verified);
        setState(alreadyConfirmed ? "already-confirmed" : "success");
      })
      .catch((err) => {
        if (!active) return;
        const safeMessage =
          err?.errors?.[0]?.message ||
          err?.message ||
          "Não foi possível confirmar este e-mail. O link pode estar expirado ou já ter sido usado.";
        setMessage(safeMessage);
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [token]);

  const isSuccess = state === "success" || state === "already-confirmed";
  const ctaTarget = hasSession ? "/app/dashboard" : "/auth";
  const ctaLabel = hasSession ? "Ir para a plataforma" : "Ir para login";

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Card className="p-8 text-center shadow-[var(--shadow-soft)] border-border/60">
          <img src={appLogoUrl} alt={appLogoAlt} className="mx-auto mb-8 h-9 w-auto" />

          {state === "loading" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Confirmando seu e-mail</h1>
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto validamos o link de confirmação.
                </p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="space-y-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CircleCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">E-mail confirmado</h1>
                <p className="text-sm text-muted-foreground">
                  {state === "already-confirmed"
                    ? "Este e-mail já estava confirmado. Você pode continuar acessando a plataforma."
                    : "Seu e-mail foi validado com sucesso. Agora você pode entrar na plataforma."}
                </p>
              </div>
              {!hasSession && (
                <Alert className="text-left">
                  <AlertTitle>Login necessário</AlertTitle>
                  <AlertDescription>
                    O contrato atual confirma o e-mail, mas não retorna uma sessão autenticada nesta etapa.
                    Entre com o e-mail e a senha cadastrados para continuar.
                  </AlertDescription>
                </Alert>
              )}
              <Button asChild className="w-full">
                <Link to={ctaTarget}>{ctaLabel}</Link>
              </Button>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <CircleAlert className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Não foi possível confirmar</h1>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button asChild className="w-full">
                <Link to="/auth">Voltar para login</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
