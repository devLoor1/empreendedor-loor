import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { appLogoAlt, appLogoUrl } from "@/config/brand";
import { isAuthenticated } from "@/hooks/use-auth";
import { confirmRegister, setToken } from "@/services/api";

type ConfirmationState =
  | "loading"
  | "success"
  | "already-confirmed"
  | "authenticated-success"
  | "error";

type ConfirmationResponse = {
  data?: {
    token?: string;
    access_token?: string;
    user_type?: string;
    user_has_already_been_verified?: boolean;
  };
  token?: string;
  access_token?: string;
};

function getConfirmationErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "Não foi possível confirmar este e-mail. Tente novamente.";
  }

  const candidate = error as {
    errors?: Array<{ message?: string }>;
    message?: string;
    status?: number;
  };

  const rawMessage = candidate.errors?.[0]?.message || candidate.message || "";
  const message = rawMessage.toLowerCase();

  if (candidate.status === 404 || message.includes("invalid") || message.includes("inválid")) {
    return "Este link de confirmação é inválido. Volte para o login e solicite um novo e-mail de confirmação.";
  }

  if (candidate.status === 410 || message.includes("expir") || message.includes("token_expired")) {
    return "Este link de confirmação expirou. Volte para o login e solicite um novo e-mail de confirmação.";
  }

  if (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("sem conexão")
  ) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }

  return (
    rawMessage ||
    "Não foi possível confirmar este e-mail. O link pode estar expirado ou já ter sido usado."
  );
}

function getReturnedToken(response: ConfirmationResponse | null) {
  return (
    response?.data?.token ||
    response?.data?.access_token ||
    response?.token ||
    response?.access_token ||
    null
  );
}

export default function VerificationEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [message, setMessage] = useState("");
  const hasSession = isAuthenticated();

  useEffect(() => {
    let active = true;
    let redirectTimer: number | undefined;

    async function verify() {
      if (!token) {
        setState("error");
        setMessage("Link de confirmação inválido. Solicite um novo e-mail de confirmação.");
        return;
      }

      try {
        const response = (await confirmRegister(token)) as ConfirmationResponse | null;
        if (!active) return;

        const returnedToken = getReturnedToken(response);
        const alreadyConfirmed = Boolean(response?.data?.user_has_already_been_verified);

        if (returnedToken) {
          setToken(returnedToken);
          setState("authenticated-success");
          redirectTimer = window.setTimeout(
            () => navigate("/app/dashboard", { replace: true }),
            2200,
          );
          return;
        }

        setState(alreadyConfirmed ? "already-confirmed" : "success");
      } catch (err: unknown) {
        if (!active) return;
        setMessage(getConfirmationErrorMessage(err));
        setState("error");
      }
    }

    verify();

    return () => {
      active = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [token, navigate]);

  const isSuccess =
    state === "success" || state === "already-confirmed" || state === "authenticated-success";
  const canOpenPlatform = hasSession || state === "authenticated-success";
  const ctaTarget = canOpenPlatform ? "/app/dashboard" : "/auth";
  const ctaLabel = canOpenPlatform ? "Ir para a plataforma" : "Ir para login";
  const successTitle = state === "already-confirmed" ? "E-mail já confirmado" : "E-mail confirmado";
  const successMessage =
    state === "already-confirmed"
      ? "Este e-mail já estava confirmado. Você pode continuar acessando a plataforma."
      : "Seu e-mail foi validado com sucesso. Agora você pode continuar o acesso ao Frontend Empreendedor.";

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Card className="border-border/60 p-8 text-center shadow-[var(--shadow-soft)]">
          <img src={appLogoUrl} alt={appLogoAlt} className="mx-auto mb-8 h-9 w-auto" />

          {state === "loading" && (
            <div className="space-y-4 py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Confirmando seu e-mail</h1>
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto validamos o link de confirmação do empreendedor.
                </p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="space-y-5 py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CircleCheck className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">{successTitle}</h1>
                <p className="text-sm text-muted-foreground">{successMessage}</p>
              </div>

              {canOpenPlatform ? (
                <Alert className="text-left">
                  <AlertTitle>Acesso liberado</AlertTitle>
                  <AlertDescription>
                    Sua sessão foi reconhecida. Você pode seguir para a plataforma.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="text-left">
                  <AlertTitle>Login necessário</AlertTitle>
                  <AlertDescription>
                    O contrato atual confirma o e-mail, mas não retorna uma sessão autenticada nesta
                    etapa. Entre com o e-mail e a senha cadastrados para continuar.
                  </AlertDescription>
                </Alert>
              )}

              <Button asChild className="w-full">
                <Link to={ctaTarget}>{ctaLabel}</Link>
              </Button>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-5 py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <CircleAlert className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Não foi possível confirmar
                </h1>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline">
                  <Link to="/auth">Voltar para login</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Cadastrar novamente</Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
