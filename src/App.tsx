import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { mockStore } from "@/lib/mock-store";
import { AppShell } from "@/components/app-shell";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import CompanyPage from "@/pages/perfil-empresa";
import PersonalPage from "@/pages/perfil-pessoal";
import DocsPage from "@/pages/documentos";
import CampaignsPage from "@/pages/campanhas";
import CampaignDetail from "@/pages/campanha-detalhe";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = mockStore.getUser();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const user = mockStore.getUser();
  return <Navigate to={user ? "/app/dashboard" : "/auth"} replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/auth" element={<AuthPage />} />
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
          <Route path="campanhas/:id" element={<CampaignDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
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
