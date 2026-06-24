import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { mockStore, useMock, lookupCnpj, type CompanyProfile } from "@/lib/mock-store";

export const Route = createFileRoute("/app/perfil-empresa")({
  component: CompanyPage,
});

const EMPTY: CompanyProfile = {
  cnpj: "", business_name: "", trade_name: "", opening_date: "", legal_nature: "",
  share_capital: "", main_activity: "", email: "", phone: "",
  address: { street: "", number: "", complement: "", district: "", city: "", state: "", zip_code: "" },
};

function CompanyPage() {
  const saved = useMock(() => mockStore.getCompany());
  const [data, setData] = useState<CompanyProfile>(saved ?? EMPTY);
  const [cnpjInput, setCnpjInput] = useState(saved?.cnpj ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (saved) setData(saved); }, [saved]);

  const handleLookup = async () => {
    setLoading(true);
    try {
      const result = await lookupCnpj(cnpjInput);
      setData(result);
      toast.success("Dados encontrados! Revise e salve.");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao buscar CNPJ");
    } finally { setLoading(false); }
  };

  const handleSave = () => {
    if (!data.cnpj || !data.business_name) return toast.error("Preencha ao menos CNPJ e Razão Social");
    mockStore.setCompany(data);
    toast.success("Perfil da empresa salvo!");
  };

  const upd = (patch: Partial<CompanyProfile>) => setData((d) => ({ ...d, ...patch }));
  const updAddr = (patch: Partial<CompanyProfile["address"]>) => setData((d) => ({ ...d, address: { ...d.address, ...patch } }));

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil da empresa</h1>
          <p className="text-muted-foreground mt-1">Busque automaticamente pelo CNPJ e complete os dados da sua startup.</p>
        </div>
        {saved && <Badge className="bg-success text-success-foreground hover:bg-success"><CheckCircle2 className="w-3 h-3 mr-1" /> Salvo</Badge>}
      </header>

      <Card className="p-6 border-border/60" style={{ background: "var(--gradient-subtle)" }}>
        <Label htmlFor="cnpj-lookup" className="text-sm font-medium">Buscar pelo CNPJ</Label>
        <p className="text-sm text-muted-foreground mb-3">Vamos preencher os campos automaticamente com os dados da Receita.</p>
        <div className="flex gap-2">
          <Input id="cnpj-lookup" placeholder="00.000.000/0000-00" value={cnpjInput} onChange={(e) => setCnpjInput(e.target.value)} className="bg-background" />
          <Button onClick={handleLookup} disabled={loading || !cnpjInput}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-5 border-border/60">
        <h2 className="font-semibold text-foreground">Dados cadastrais</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CNPJ"><Input value={data.cnpj} onChange={(e) => upd({ cnpj: e.target.value })} /></Field>
          <Field label="Razão Social"><Input value={data.business_name} onChange={(e) => upd({ business_name: e.target.value })} /></Field>
          <Field label="Nome Fantasia"><Input value={data.trade_name} onChange={(e) => upd({ trade_name: e.target.value })} /></Field>
          <Field label="Data de abertura"><Input type="date" value={data.opening_date} onChange={(e) => upd({ opening_date: e.target.value })} /></Field>
          <Field label="Natureza jurídica"><Input value={data.legal_nature} onChange={(e) => upd({ legal_nature: e.target.value })} /></Field>
          <Field label="Capital social (R$)"><Input value={data.share_capital} onChange={(e) => upd({ share_capital: e.target.value })} /></Field>
          <Field label="Atividade principal" className="sm:col-span-2"><Input value={data.main_activity} onChange={(e) => upd({ main_activity: e.target.value })} /></Field>
          <Field label="E-mail corporativo"><Input type="email" value={data.email} onChange={(e) => upd({ email: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={data.phone} onChange={(e) => upd({ phone: e.target.value })} /></Field>
        </div>
      </Card>

      <Card className="p-6 space-y-5 border-border/60">
        <h2 className="font-semibold text-foreground">Endereço</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CEP"><Input value={data.address.zip_code} onChange={(e) => updAddr({ zip_code: e.target.value })} /></Field>
          <Field label="Logradouro"><Input value={data.address.street} onChange={(e) => updAddr({ street: e.target.value })} /></Field>
          <Field label="Número"><Input value={data.address.number} onChange={(e) => updAddr({ number: e.target.value })} /></Field>
          <Field label="Complemento"><Input value={data.address.complement} onChange={(e) => updAddr({ complement: e.target.value })} /></Field>
          <Field label="Bairro"><Input value={data.address.district} onChange={(e) => updAddr({ district: e.target.value })} /></Field>
          <Field label="Cidade"><Input value={data.address.city} onChange={(e) => updAddr({ city: e.target.value })} /></Field>
          <Field label="Estado"><Input value={data.address.state} onChange={(e) => updAddr({ state: e.target.value })} /></Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Salvar perfil da empresa</Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}