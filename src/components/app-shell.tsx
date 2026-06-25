import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, User, FileCheck2, Megaphone, LogOut } from "lucide-react";
import { mockStore, useMock } from "@/lib/mock-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { appLogoUrl, appLogoAlt } from "@/config/brand";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/perfil-empresa", label: "Perfil da empresa", icon: Building2 },
  { to: "/app/perfil-pessoal", label: "Perfil pessoal", icon: User },
  { to: "/app/documentos", label: "Documentos", icon: FileCheck2 },
  { to: "/app/campanhas", label: "Campanhas", icon: Megaphone },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useMock(() => mockStore.getUser());

  const handleSignOut = () => {
    mockStore.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <img src={appLogoUrl} alt={appLogoAlt} className="h-8 w-auto" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground truncate">{user?.full_name ?? "Empreendedor"}</div>
            <div className="truncate">{user?.email}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-2 font-semibold">
            <img src={appLogoUrl} alt={appLogoAlt} className="h-7 w-auto" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4" /></Button>
        </header>
        <nav className="md:hidden flex overflow-x-auto border-b border-border bg-card px-2">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={cn("px-3 py-3 text-xs whitespace-nowrap border-b-2", active ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}