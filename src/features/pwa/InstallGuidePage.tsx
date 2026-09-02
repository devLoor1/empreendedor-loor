import { ArrowLeft, CheckCircle2, Download, ExternalLink, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { InstallTutorialAnimation } from "./InstallTutorialAnimation";
import { isAppleSafariContext } from "./installEnvironment";
import { usePwaInstall } from "./usePwaInstall";
import { runtimePwaConfig } from "./runtimePwaConfig";

export type InstallGuidePlatform = "android" | "apple";

export function InstallGuidePage({ platform }: { platform: InstallGuidePlatform }) {
  const { canPrompt, installed, promptInstall } = usePwaInstall();
  const [feedback, setFeedback] = useState<string | null>(null);
  const isAndroid = platform === "android";
  const appleSafari = !isAndroid && isAppleSafariContext();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Instalar ${runtimePwaConfig.shortName} — ${isAndroid ? "Android" : "Apple"}`;
    return () => {
      document.title = previousTitle;
    };
  }, [isAndroid]);

  const handleInstall = async () => {
    setFeedback(null);
    try {
      const outcome = await promptInstall();
      if (outcome === "dismissed") {
        setFeedback("Instalação cancelada. Você pode tentar novamente pelo menu do navegador.");
      } else if (outcome === "unavailable") {
        setFeedback("Use as instruções manuais abaixo para instalar.");
      }
    } catch {
      setFeedback("O navegador não abriu a instalação. Use as instruções manuais abaixo.");
    }
  };

  const steps = isAndroid
    ? [
        "Abra o menu do navegador.",
        "Toque em “Instalar app” ou “Adicionar à tela inicial”.",
        "Confirme a instalação para criar o ícone no aparelho.",
      ]
    : [
        "Abra o menu Compartilhar.",
        "Toque em “Adicionar à Tela de Início”.",
        "Ative “Abrir como App da Web”, quando essa opção aparecer.",
        "Toque em “Adicionar”.",
      ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <img
            src={runtimePwaConfig.logo}
            alt={`Logo ${runtimePwaConfig.brandName}`}
            className="h-10 max-w-[145px] object-contain sm:h-12 sm:max-w-[180px]"
          />
          <Link
            to={runtimePwaConfig.startUrl}
            className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-muted sm:px-4 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao aplicativo
          </Link>
        </header>

        <section className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: runtimePwaConfig.themeColor }}
            >
              {isAndroid ? <Download className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {isAndroid ? "Instalação no Android" : "Instalação no iPhone ou iPad"}
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
              Instale {runtimePwaConfig.brandName} no seu celular
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Acesse com um toque e use o aplicativo em uma janela própria, sem precisar procurar o
              site novamente.
            </p>

            {installed ? (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">
                  Este aplicativo já está aberto no modo instalado.
                </p>
              </div>
            ) : null}

            {isAndroid && canPrompt && !installed ? (
              <button
                type="button"
                onClick={handleInstall}
                className="mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: runtimePwaConfig.themeColor }}
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                Instalar agora
              </button>
            ) : null}

            {feedback ? (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {feedback}
              </p>
            ) : null}

            {!isAndroid && !appleSafari ? (
              <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Procure primeiro “Adicionar à Tela de Início” no menu de compartilhamento deste
                navegador. Se a opção não estiver disponível, use “Abrir no Safari” e continue os
                mesmos passos.
              </div>
            ) : null}
          </div>

          <InstallTutorialAnimation
            platform={platform}
            brandName={runtimePwaConfig.brandName}
            icon={runtimePwaConfig.icons.icon192}
            themeColor={runtimePwaConfig.themeColor}
          />
        </section>

        <section className="mt-14 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">Como instalar manualmente</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl bg-muted/45 p-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: runtimePwaConfig.themeColor }}
                >
                  {index + 1}
                </span>
                <span className="pt-1 text-sm leading-6 text-foreground">{step}</span>
              </li>
            ))}
          </ol>

          {isAndroid && !canPrompt && !installed ? (
            <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />O botão
              automático depende do navegador. As instruções manuais continuam válidas quando ele
              não está disponível.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
