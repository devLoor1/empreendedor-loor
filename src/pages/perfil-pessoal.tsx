import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { mockStore, useMock, type PersonalProfile } from "@/lib/mock-store";

const EMPTY: PersonalProfile = {
  full_name: "", phone: "", gender: "", cpf: "", rg: "", issuing_entity: "", marital_status: "", birth_date: "",
};

export default function PersonalPage() {
  const user = useMock(() => mockStore.getUser());
  const saved = useMock(() => mockStore.getPersonal());
  const [data, setData] = useState<PersonalProfile>(saved ?? { ...EMPTY, full_name: user?.full_name ?? "", phone: user?.phone ?? "" });

  useEffect(() => { if (saved) setData(saved); }, [saved]);

  const upd = (patch: Partial<PersonalProfile>) => setData((d) => ({ ...d, ...patch }));

  const save = () => {
    if (!data.full_name || !data.cpf) return toast.error("Nome e CPF são obrigatórios");
    mockStore.setPersonal(data);
    toast.success("Perfil pessoal salvo!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil pessoal</h1>
          <p className="text-muted-foreground mt-1">Informações do responsável pela startup.</p>
        </div>
        {saved && <Badge className="bg-success text-success-foreground hover:bg-success"><CheckCircle2 className="w-3 h-3 mr-1" /> Salvo</Badge>}
      </header>

      <Card className="p-6 space-y-5 border-border/60">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome completo"><Input value={data.full_name} onChange={(e) => upd({ full_name: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={data.phone} onChange={(e) => upd({ phone: e.target.value })} placeholder="(11) 99999-9999" /></Field>
          <Field label="CPF"><Input value={data.cpf} onChange={(e) => upd({ cpf: e.target.value })} placeholder="000.000.000-00" /></Field>
          <Field label="RG"><Input value={data.rg} onChange={(e) => upd({ rg: e.target.value })} /></Field>
          <Field label="Órgão emissor"><Input value={data.issuing_entity} onChange={(e) => upd({ issuing_entity: e.target.value })} placeholder="SSP/SP" /></Field>
          <Field label="Data de nascimento"><Input type="date" value={data.birth_date} onChange={(e) => upd({ birth_date: e.target.value })} /></Field>
          <Field label="Gênero">
            <Select value={data.gender} onValueChange={(v) => upd({ gender: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado civil">
            <Select value={data.marital_status} onValueChange={(v) => upd({ marital_status: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                <SelectItem value="uniao_estavel">União estável</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} size="lg">Salvar perfil pessoal</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
