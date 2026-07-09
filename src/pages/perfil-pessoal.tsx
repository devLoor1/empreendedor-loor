import { useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getPersonalInformation, updatePersonalInformation } from "@/services/api";

type PersonalForm = {
  full_name: string;
  phone: string;
  gender: string;
  cpf: string;
  rg: string;
  issuing_entity: string;
  marital_status: string;
  birth_date: string;
};

const EMPTY: PersonalForm = {
  full_name: "", phone: "", gender: "", cpf: "", rg: "", issuing_entity: "", marital_status: "", birth_date: "",
};

type ApiValidationError = {
  errors?: Array<{ field?: string; message?: string }>;
  message?: string;
};

const GENDER_VALUE_MAP: Record<string, string> = {
  masculino: "male",
  feminino: "female",
  outro: "another",
  male: "male",
  female: "female",
  another: "another",
};

const MARITAL_STATUS_VALUE_MAP: Record<string, string> = {
  solteiro: "single",
  casado: "married",
  divorciado: "divorced",
  viuvo: "widower-widow",
  single: "single",
  married: "married",
  divorced: "divorced",
  "widower-widow": "widower-widow",
};

function normalizeGender(value: unknown) {
  return typeof value === "string" ? GENDER_VALUE_MAP[value] ?? value : "";
}

function normalizeMaritalStatus(value: unknown) {
  return typeof value === "string" ? MARITAL_STATUS_VALUE_MAP[value] ?? "" : "";
}

function getPersonalProfileErrorMessage(error: unknown) {
  const fallback = "Erro ao salvar perfil pessoal";

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const apiError = error as ApiValidationError;
  const firstError = apiError.errors?.[0];
  const rawMessage = firstError?.message || apiError.message || "";
  const normalizedMessage = rawMessage.toLowerCase();
  const normalizedField = firstError?.field?.toLowerCase();

  if (
    normalizedField === "gender" ||
    normalizedMessage.includes("validator.shared.gender") ||
    (normalizedMessage.includes("translation missing") && normalizedMessage.includes("gender"))
  ) {
    return "Selecione uma opção de gênero.";
  }

  if (
    normalizedField === "marital_status" ||
    normalizedMessage.includes("validator.shared.marital_status")
  ) {
    return "Selecione uma opção de estado civil.";
  }

  return rawMessage || fallback;
}

export default function PersonalPage() {
  const [data, setData] = useState<PersonalForm>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPersonalInformation()
      .then((res) => {
        if (res?.data) {
          const d = res.data;
          setData({
            full_name: d.full_name ?? "",
            phone: d.phone ?? "",
            gender: normalizeGender(d.gender),
            cpf: d.cpf ?? "",
            rg: d.rg ?? "",
            issuing_entity: d.issuing_entity ?? "",
            marital_status: normalizeMaritalStatus(d.marital_status),
            birth_date: d.birth_date ? String(d.birth_date).slice(0, 10) : "",
          });
          if (d.cpf) setSaved(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upd = (patch: Partial<PersonalForm>) => setData((d) => ({ ...d, ...patch }));

  const save = async () => {
    if (!data.full_name || !data.cpf) return toast.error("Nome e CPF são obrigatórios");
    if (!data.phone) return toast.error("Telefone é obrigatório");
    if (!data.gender) return toast.error("Gênero é obrigatório");
    if (!data.marital_status) return toast.error("Estado civil é obrigatório");
    if (!data.birth_date) return toast.error("Data de nascimento é obrigatória");
    setSaving(true);
    try {
      await updatePersonalInformation(data);
      setSaved(true);
      toast.success("Perfil pessoal salvo com sucesso!");
    } catch (err: unknown) {
      toast.error(getPersonalProfileErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil pessoal</h1>
          <p className="text-muted-foreground mt-1">Informações do responsável pela startup.</p>
        </div>
        {saved && (
          <Badge className="bg-success text-success-foreground hover:bg-success">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Salvo
          </Badge>
        )}
      </header>

      <Card className="p-6 space-y-5 border-border/60">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome completo">
            <Input value={data.full_name} onChange={(e) => upd({ full_name: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <Input value={data.phone} onChange={(e) => upd({ phone: e.target.value })} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="CPF">
            <Input value={data.cpf} onChange={(e) => upd({ cpf: e.target.value })} placeholder="000.000.000-00" />
          </Field>
          <Field label="RG">
            <Input value={data.rg} onChange={(e) => upd({ rg: e.target.value })} />
          </Field>
          <Field label="Órgão emissor">
            <Input value={data.issuing_entity} onChange={(e) => upd({ issuing_entity: e.target.value })} placeholder="SSP/SP" />
          </Field>
          <Field label="Data de nascimento">
            <Input type="date" value={data.birth_date} onChange={(e) => upd({ birth_date: e.target.value })} />
          </Field>
          <Field label="Gênero">
            <Select value={data.gender} onValueChange={(v) => upd({ gender: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="another">Outro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado civil">
            <Select value={data.marital_status} onValueChange={(v) => upd({ marital_status: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Solteiro(a)</SelectItem>
                <SelectItem value="married">Casado(a)</SelectItem>
                <SelectItem value="divorced">Divorciado(a)</SelectItem>
                <SelectItem value="widower-widow">Viúvo(a)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} size="lg" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : "Salvar perfil pessoal"}
        </Button>
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
