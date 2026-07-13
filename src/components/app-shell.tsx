import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, User, FileCheck2, Megaphone, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/services/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appLogoUrl, appLogoAlt } from "@/config/brand";

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
    return <span className={cn("text-xl font-bold tracking-normal text-primary", className)}>LOOR</span>;
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
  const initials = (user?.full_name || user?.email || "Empreendedor")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleSignOut = async () => {
    try { await logout(); } catch { /* ignora erro de rede */ }
    signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="h-20 flex items-center px-6 border-b border-border">
          <SidebarLogo className="h-14 max-w-[160px]" />
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
          <Link
            to="/app/perfil-pessoal"
            className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Alterar avatar e perfil pessoal"
          >
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={avatarUrl} alt={user?.full_name ?? "Avatar do empreendedor"} />
              <AvatarFallback>{initials || "EM"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">
                {user?.full_name ?? "Empreendedor"}
              </div>
              <div className="truncate">{user?.email}</div>
            </div>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-2 font-semibold">
            <SidebarLogo className="h-10 max-w-[140px]" />
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
