import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Rocket, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { mockStore } from "@/lib/mock-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Loor — Acesso do Empreendedor" },
      { name: "description", content: "Entre ou cadastre sua startup na plataforma Loor." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground relative overflow-hidden" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Rocket className="w-6 h-6" /> Loor
        </div>
        <div className="space-y-6 relative z-10">
          <h1 className="text-4xl font-bold leading-tight">A plataforma onde sua startup encontra investidores.</h1>
          <p className="text-primary-foreground/85 text-lg">Cadastre sua empresa, organize sua documentação CVM 88 e lance sua campanha de captação em poucos passos.</p>
          <ul className="space-y-3 text-primary-foreground/90">
            <li className="flex items-center gap-3"><Sparkles className="w-5 h-5" /> Onboarding rápido com busca automática por CNPJ</li>
            <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Checklist de documentos conforme CVM 88</li>
            <li className="flex items-center gap-3"><TrendingUp className="w-5 h-5" /> Acompanhamento de campanhas em tempo real</li>
          </ul>
        </div>
        <p className="text-sm text-primary-foreground/70 relative z-10">© {new Date().getFullYear()} Loor Capital — Crowdfunding regulado pela CVM</p>
        <div aria-hidden className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 shadow-[var(--shadow-soft)] border-border/60">
          <div className="lg:hidden flex items-center gap-2 text-xl font-semibold text-primary mb-6">
            <Rocket className="w-6 h-6" /> Loor
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Bem-vindo(a) de volta</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Acesse sua conta ou cadastre sua startup.</p>
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar startup</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="register"><RegisterForm /></TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Preencha e-mail e senha");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const existing = mockStore.getUser();
    mockStore.setUser({ email, full_name: existing?.full_name ?? email.split("@")[0], phone: existing?.phone ?? "" });
    toast.success("Bem-vindo(a)!");
    navigate({ to: "/app/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="voce@startup.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
      <button type="button" className="text-sm text-muted-foreground hover:text-primary w-full text-center">Esqueci minha senha</button>
    </form>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) return toast.error("Preencha os campos obrigatórios");
    if (form.password.length < 6) return toast.error("A senha deve ter ao menos 6 caracteres");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    mockStore.setUser({ email: form.email, full_name: form.full_name, phone: form.phone });
    toast.success("Cadastro realizado! Vamos completar seu perfil.");
    navigate({ to: "/app/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="r-name">Nome completo</Label>
        <Input id="r-name" placeholder="Seu nome" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-email">E-mail</Label>
        <Input id="r-email" type="email" placeholder="voce@startup.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-phone">Telefone</Label>
        <Input id="r-phone" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-pwd">Senha</Label>
        <Input id="r-pwd" type="password" placeholder="Mín. 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando conta..." : "Criar conta e entrar"}</Button>
      <p className="text-xs text-muted-foreground text-center">Ao se cadastrar você concorda com os termos da plataforma Loor.</p>
    </form>
  );
}