import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { isAuthenticated } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { ToolAccessGuard } from "@/components/tool-access-guard";
import AuthPage from "@/pages/auth";
import ChangePasswordPage from "@/pages/change-password";
import VerificationEmailPage from "@/pages/verification-email";
import Dashboard from "@/pages/dashboard";
import CompanyPage from "@/pages/perfil-empresa";
import PersonalPage from "@/pages/perfil-pessoal";
import DocsPage from "@/pages/documentos";
import CampaignsPage from "@/pages/campanhas";
import CampaignCreatePage from "@/pages/campanha-nova";
import CampaignDetail from "@/pages/campanha-detalhe";
import CampaignDebtPage from "@/pages/campanha-divida";
import ToolsPage from "@/pages/ferramentas";
import ToolsKanbanPage from "@/pages/ferramentas-kanban";
import ToolsPitchDeckPage from "@/pages/ferramentas-pitch-deck";
import { InstallGuidePage } from "@/features/pwa/InstallGuidePage";
import { InstallPromotionBanner } from "@/features/pwa/InstallPromotionBanner";
import { PwaInstallProvider } from "@/features/pwa/PwaInstallProvider";

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? "/app/dashboard" : "/auth"} replace />;
}

export default function App() {
  return (
    <PwaInstallProvider>
      <InstallPromotionBanner />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/app-android" element={<InstallGuidePage platform="android" />} />
        <Route path="/app-apple" element={<InstallGuidePage platform="apple" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/entrepreneur/change-password/:token" element={<ChangePasswordPage />} />
        <Route path="/verification-email" element={<VerificationEmailPage />} />
        <Route path="/verification-email/:token" element={<VerificationEmailPage />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="perfil-empresa" element={<CompanyPage />} />
          <Route path="perfil-pessoal" element={<PersonalPage />} />
          <Route path="documentos" element={<DocsPage />} />
          <Route path="campanhas" element={<CampaignsPage />} />
          <Route path="campanhas/nova" element={<CampaignCreatePage />} />
          <Route path="campanhas/:id" element={<CampaignDetail />} />
          <Route path="campanhas/:id/divida" element={<CampaignDebtPage />} />
          <Route path="ferramentas" element={<ToolsPage />} />
          <Route
            path="ferramentas/kanban"
            element={(
              <ToolAccessGuard toolKey="kanban" label="Kanban">
                <ToolsKanbanPage />
              </ToolAccessGuard>
            )}
          />
          <Route
            path="ferramentas/pitch-deck"
            element={(
              <ToolAccessGuard toolKey="pitch_deck" label="Pitch Deck">
                <ToolsPitchDeckPage />
              </ToolAccessGuard>
            )}
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </PwaInstallProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}
