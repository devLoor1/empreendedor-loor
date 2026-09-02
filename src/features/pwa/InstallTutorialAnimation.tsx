import { Check, Download, Globe2, Home, MoreHorizontal, Share2 } from "lucide-react";
import type { CSSProperties } from "react";
import "./installTutorialAnimation.css";

type InstallTutorialAnimationProps = {
  platform: "android" | "apple";
  brandName: string;
  icon: string;
  themeColor: string;
};

const ANDROID_STEPS = [
  "Abra a plataforma no navegador",
  "Toque em Instalar aplicativo",
  "Confirme a instalação",
  "Encontre o app na tela inicial",
];

const APPLE_STEPS = [
  "Abra a plataforma no navegador",
  "Use a ação Compartilhar",
  "Escolha Adicionar à Tela de Início",
  "Confirme a adição",
  "Encontre o app na tela inicial",
];

export function InstallTutorialAnimation({
  platform,
  brandName,
  icon,
  themeColor,
}: InstallTutorialAnimationProps) {
  const isAndroid = platform === "android";
  const steps = isAndroid ? ANDROID_STEPS : APPLE_STEPS;
  const accentStyle = {
    "--tutorial-accent": themeColor,
  } as CSSProperties;

  return (
    <figure
      className="install-tutorial"
      data-platform={platform}
      style={accentStyle}
      aria-label={`Animação conceitual de instalação de ${brandName} no ${isAndroid ? "Android" : "iPhone ou iPad"}`}
    >
      <div className="install-tutorial__visual" aria-hidden="true">
        <div className="install-tutorial__phone">
          <div className="install-tutorial__speaker" />
          <div className="install-tutorial__screen">
            <section className="install-tutorial__scene install-tutorial__browser">
              <div className="install-tutorial__browser-bar">
                <Globe2 size={14} />
                <span>{brandName}</span>
                <MoreHorizontal size={15} />
              </div>
              <div className="install-tutorial__browser-content">
                <img src={icon} alt="" />
                <strong>{brandName}</strong>
                <span>Plataforma aberta no navegador</span>
              </div>
              <button type="button" tabIndex={-1}>
                {isAndroid ? <Download size={14} /> : <Share2 size={14} />}
                {isAndroid ? "Opções de instalação" : "Compartilhar"}
              </button>
            </section>

            <section className="install-tutorial__scene install-tutorial__actions">
              <div className="install-tutorial__panel-heading">
                <span>{isAndroid ? "Ações do navegador" : "Compartilhar"}</span>
                <MoreHorizontal size={16} />
              </div>

              {isAndroid ? (
                <div className="install-tutorial__action install-tutorial__action--install">
                  <span className="install-tutorial__action-icon">
                    <Download size={17} />
                  </span>
                  <span>
                    <strong>Instalar aplicativo</strong>
                    <small>A ação começa somente após seu toque</small>
                  </span>
                </div>
              ) : (
                <>
                  <div className="install-tutorial__action install-tutorial__action--share">
                    <span className="install-tutorial__action-icon">
                      <Share2 size={17} />
                    </span>
                    <span>
                      <strong>Compartilhar</strong>
                      <small>Abra as ações disponíveis</small>
                    </span>
                  </div>
                  <div className="install-tutorial__action install-tutorial__action--home">
                    <span className="install-tutorial__action-icon">
                      <Home size={17} />
                    </span>
                    <span>
                      <strong>Adicionar à Tela de Início</strong>
                      <small>Crie um acesso ao aplicativo</small>
                    </span>
                  </div>
                </>
              )}
            </section>

            <section className="install-tutorial__scene install-tutorial__confirmation">
              <img src={icon} alt="" />
              <span>Adicionar aplicativo</span>
              <strong>{brandName}</strong>
              <button type="button" tabIndex={-1}>
                <Check size={15} />
                Confirmar
              </button>
            </section>

            <section className="install-tutorial__scene install-tutorial__home-screen">
              <div className="install-tutorial__success">
                <span className="install-tutorial__success-icon">
                  <Check size={13} />
                </span>
                Instalação concluída
              </div>
              <div className="install-tutorial__app-grid">
                <span className="install-tutorial__placeholder-app" />
                <span className="install-tutorial__placeholder-app" />
                <span className="install-tutorial__placeholder-app" />
                <span className="install-tutorial__placeholder-app" />
              </div>
              <div className="install-tutorial__installed-app">
                <span>
                  <img src={icon} alt="" />
                </span>
                <strong>{brandName}</strong>
              </div>
            </section>

            <span className="install-tutorial__tap install-tutorial__tap--primary" />
            <span className="install-tutorial__tap install-tutorial__tap--secondary" />
          </div>
        </div>

        <div className="install-tutorial__timeline">
          <span />
        </div>
        <p>Fluxo conceitual · cerca de 10 segundos</p>
      </div>

      <figcaption className="install-tutorial__caption">
        <strong>O que acontece</strong>
        <ol>
          {steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
