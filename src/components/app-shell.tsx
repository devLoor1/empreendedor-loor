import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, User, FileCheck2, Megaphone, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/services/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { appLogoUrl, appLogoAlt } from "@/config/brand";
import { EntrepreneurAvatar } from "@/components/entrepreneur-avatar";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/perfil-empresa", label: "Perfil da empresa", icon: Building2 },
  { to: "/app/perfil-pessoal", label: "Perfil pessoal", icon: User },
  { to: "/app/documentos", label: "Documentos", icon: FileCheck2 },
  { to: "/app/campanhas", label: "Campanhas", icon: Megaphone },
] as const;

function SidebarLogo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!appLogoUrl || failed) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xl font-bold tracking-normal text-primary ring-1 ring-primary/15",
          className,
        )}
      >
        LOOR
      </span>
    );
  }

  return (
    <img
      src={appLogoUrl}
      alt={appLogoAlt}
      className={cn("w-auto object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const avatarUrl = user?.avatar || user?.image_url || "";

  const handleSignOut = async () => {
    try { await logout(); } catch { /* ignora erro de rede */ }
    signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/95 md:flex">
        <div className="flex h-20 items-center border-b border-border px-6">
          <SidebarLogo className="h-14 max-w-[160px]" />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/app/perfil-pessoal"
            className="mb-2 flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            title="Alterar avatar e perfil pessoal"
          >
            <EntrepreneurAvatar
              src={avatarUrl}
              name={user?.full_name}
              email={user?.email}
              className="h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">
                {user?.full_name ?? "Empreendedor"}
              </div>
              <div className="truncate">{user?.email}</div>
            </div>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-2 font-semibold">
            <SidebarLogo className="h-10 max-w-[140px]" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <nav className="flex overflow-x-auto border-b border-border bg-card/95 px-2 md:hidden">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link key={item.to} to={item.to} className={cn("whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition-colors", active ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 overflow-x-hidden p-5 sm:p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
