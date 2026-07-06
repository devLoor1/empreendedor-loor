import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getAddress, saveAddress } from "@/services/api";

type AddressForm = {
  country_id: number;
  state: string;
  city: string;
  district: string;
  zip_code: string;
  street_name: string;
  number: string;
  complement: string;
};

const EMPTY: AddressForm = {
  country_id: 1,
  state: "", city: "", district: "", zip_code: "", street_name: "", number: "", complement: "",
};

export default function CompanyPage() {
  const [address, setAddress] = useState<AddressForm>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAddress()
      .then((res) => {
        if (res?.data) {
          const d = res.data;
          setAddress({
            country_id: d.country_id ?? 1,
            state: d.state ?? "",
            city: d.city ?? "",
            district: d.district ?? "",
            zip_code: d.zip_code ?? "",
            street_name: d.street_name ?? "",
            number: d.number ?? "",
            complement: d.complement ?? "",
          });
          setSaved(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upd = (patch: Partial<AddressForm>) => setAddress((a) => ({ ...a, ...patch }));

  const handleSave = async () => {
    if (!address.zip_code || !address.street_name || !address.city || !address.state) {
      return toast.error("Preencha CEP, logradouro, cidade e estado");
    }
    setSaving(true);
    try {
      await saveAddress({
        ...address,
        complement: address.complement || null,
      });
      setSaved(true);
      toast.success("Endereço salvo com sucesso!");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "Erro ao salvar endereço";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil da empresa</h1>
          <p className="text-muted-foreground mt-1">Gerencie o endereço da sua startup.</p>
        </div>
        {saved && (
          <Badge className="bg-success text-success-foreground hover:bg-success">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Salvo
          </Badge>
        )}
      </header>

      <Card className="p-6 space-y-5 border-border/60">
        <h2 className="font-semibold text-foreground">Endereço</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CEP">
            <Input value={address.zip_code} onChange={(e) => upd({ zip_code: e.target.value })} placeholder="00000-000" />
          </Field>
          <Field label="Logradouro" className="sm:col-span-2">
            <Input value={address.street_name} onChange={(e) => upd({ street_name: e.target.value })} placeholder="Rua, Avenida..." />
          </Field>
          <Field label="Número">
            <Input value={address.number} onChange={(e) => upd({ number: e.target.value })} placeholder="123" />
          </Field>
          <Field label="Complemento">
            <Input value={address.complement} onChange={(e) => upd({ complement: e.target.value })} placeholder="Sala, Apto (opcional)" />
          </Field>
          <Field label="Bairro">
            <Input value={address.district} onChange={(e) => upd({ district: e.target.value })} />
          </Field>
          <Field label="Cidade">
            <Input value={address.city} onChange={(e) => upd({ city: e.target.value })} />
          </Field>
          <Field label="Estado">
            <Input value={address.state} onChange={(e) => upd({ state: e.target.value })} placeholder="SP" maxLength={2} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : "Salvar endereço"}
        </Button>
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
