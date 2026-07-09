import { useState, useEffect, type ReactNode } from "react";
import { Building2, CheckCircle2, CircleAlert, Loader2, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type CompanyStatus = "unknown" | "active" | "inactive";

type CompanyForm = {
  cnpj: string;
  legal_name: string;
  trade_name: string;
  phone: string;
  email: string;
  status: CompanyStatus;
};

type CompanyNotice = {
  kind: "info" | "error";
  title: string;
  description: string;
};

const EMPTY_ADDRESS: AddressForm = {
  country_id: 1,
  state: "",
  city: "",
  district: "",
  zip_code: "",
  street_name: "",
  number: "",
  complement: "",
};

const EMPTY_COMPANY: CompanyForm = {
  cnpj: "",
  legal_name: "",
  trade_name: "",
  phone: "",
  email: "",
  status: "unknown",
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(
    `${digits.slice(0, 12)}${firstDigit}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { errors?: Array<{ message?: string }>; message?: string };
    const message = candidate.errors?.[0]?.message || candidate.message;

    if (
      message &&
      !message.includes("Unexpected end of JSON input") &&
      !message.includes("Failed to execute 'json'")
    ) {
      return message;
    }
  }

  return "Não foi possível salvar o endereço. Tente novamente.";
}

function getAddressData(response: unknown): Partial<AddressForm> | null {
  if (!response || typeof response !== "object") return null;

  const candidate = response as { data?: unknown };
  const data = candidate.data ?? response;

  return data && typeof data === "object" ? (data as Partial<AddressForm>) : null;
}

function toAddressForm(data: Partial<AddressForm>): AddressForm {
  return {
    country_id: data.country_id ?? 1,
    state: data.state ?? "",
    city: data.city ?? "",
    district: data.district ?? "",
    zip_code: data.zip_code ?? "",
    street_name: data.street_name ?? "",
    number: data.number ?? "",
    complement: data.complement ?? "",
  };
}

function hasConfirmedAddress(data: Partial<AddressForm> | null): data is Partial<AddressForm> {
  return Boolean(
    data?.zip_code &&
      data.street_name &&
      data.city &&
      data.state &&
      data.district &&
      data.number,
  );
}

export default function CompanyPage() {
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [company, setCompany] = useState<CompanyForm>(EMPTY_COMPANY);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyChecked, setCompanyChecked] = useState(false);
  const [companyNotice, setCompanyNotice] = useState<CompanyNotice | null>(null);

  const cnpjIsFilled = onlyDigits(company.cnpj).length > 0;
  const cnpjIsValid = isValidCnpj(company.cnpj);
  const companyIsInactive = company.status === "inactive";

  useEffect(() => {
    getAddress()
      .then((res) => {
        const persistedAddress = getAddressData(res);

        if (persistedAddress) {
          setAddress(toAddressForm(persistedAddress));
          setSaved(hasConfirmedAddress(persistedAddress));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updAddress = (patch: Partial<AddressForm>) => {
    setSaved(false);
    setAddress((current) => ({ ...current, ...patch }));
  };

  const updCompany = (patch: Partial<CompanyForm>) => {
    setCompany((current) => ({ ...current, ...patch }));

    if ("cnpj" in patch) {
      setCompanyChecked(false);
      setCompanyNotice(null);
    }
  };

  const handleValidateCompany = () => {
    if (!cnpjIsFilled) {
      setCompanyChecked(false);
      setCompanyNotice({
        kind: "error",
        title: "Informe o CNPJ",
        description: "Digite um CNPJ para validar o formato antes de revisar os dados da empresa.",
      });
      return;
    }

    if (!cnpjIsValid) {
      setCompanyChecked(false);
      setCompanyNotice({
        kind: "error",
        title: "CNPJ inválido",
        description:
          "Revise os números informados. O formato visual pode estar correto, mas o dígito verificador não confere.",
      });
      return;
    }

    setCompanyChecked(true);
    setCompanyNotice({
      kind: "info",
      title: "CNPJ validado localmente",
      description:
        "A consulta automática e a persistência dos dados empresariais ainda não estão expostas no contrato backend atual. Os campos abaixo servem como revisão segura nesta etapa.",
    });
  };

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
      const persisted = getAddressData(await getAddress());

      if (!hasConfirmedAddress(persisted)) {
        throw new Error(
          "Endereço enviado, mas não foi possível confirmar o salvamento. Recarregue a página e tente novamente.",
        );
      }

      setAddress(toAddressForm(persisted));
      setSaved(true);
      toast.success("Endereço salvo com sucesso!");
    } catch (err: unknown) {
      setSaved(false);
      toast.error(getErrorMessage(err));
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
          <p className="text-muted-foreground mt-1">
            Revise o CNPJ, os dados empresariais e o endereço usados no preparo das campanhas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {companyChecked && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              <CheckCircle2 className="w-3 h-3 mr-1" /> CNPJ validado
            </Badge>
          )}
          {saved && (
            <Badge className="bg-success text-success-foreground hover:bg-success">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Endereço salvo
            </Badge>
          )}
        </div>
      </header>

      <Card className="p-6 space-y-5 border-border/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Dados da empresa</h2>
            <p className="text-sm text-muted-foreground">
              O contrato atual ainda não expõe busca ou salvamento de empresa por CNPJ; por isso
              esta seção não cria nem altera dados empresariais no backend.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="CNPJ">
            <Input
              value={company.cnpj}
              onChange={(e) => updCompany({ cnpj: formatCnpj(e.target.value) })}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              aria-invalid={cnpjIsFilled && !cnpjIsValid}
            />
          </Field>
          <Button type="button" variant="outline" onClick={handleValidateCompany}>
            <Search className="w-4 h-4" />
            Validar CNPJ
          </Button>
        </div>

        {companyNotice && (
          <Alert
            variant={companyNotice.kind === "error" ? "destructive" : "default"}
            className="border-border/60"
          >
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>{companyNotice.title}</AlertTitle>
            <AlertDescription>{companyNotice.description}</AlertDescription>
          </Alert>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Razão social">
            <Input
              value={company.legal_name}
              onChange={(e) => updCompany({ legal_name: e.target.value })}
              placeholder="Nome jurídico da empresa"
            />
          </Field>
          <Field label="Nome fantasia">
            <Input
              value={company.trade_name}
              onChange={(e) => updCompany({ trade_name: e.target.value })}
              placeholder="Nome comercial"
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={company.phone}
              onChange={(e) => updCompany({ phone: formatPhone(e.target.value) })}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </Field>
          <Field label="E-mail">
            <Input
              value={company.email}
              onChange={(e) => updCompany({ email: e.target.value })}
              placeholder="empresa@exemplo.com"
              type="email"
            />
          </Field>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Status operacional
          </Label>
          <div className="grid sm:grid-cols-3 gap-2">
            <StatusButton
              active={company.status === "unknown"}
              label="Não verificada"
              onClick={() => updCompany({ status: "unknown" })}
            />
            <StatusButton
              active={company.status === "active"}
              label="Ativa"
              onClick={() => updCompany({ status: "active" })}
            />
            <StatusButton
              active={company.status === "inactive"}
              destructive
              label="Inativa"
              onClick={() => updCompany({ status: "inactive" })}
            />
          </div>
        </div>

        {companyIsInactive ? (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Empresa inativa</AlertTitle>
            <AlertDescription>
              Um CNPJ inativo deve bloquear a abertura de campanhas. Esta tela sinaliza a restrição,
              mas a trava definitiva depende do contrato backend.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-border/60">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Pré-requisito para campanhas</AlertTitle>
            <AlertDescription>
              A criação de campanhas continua protegida pelo backend. Quando a API de empresa
              estiver disponível, este bloco deve consultar e persistir o CNPJ antes de liberar
              novas campanhas.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      <Card className="p-6 space-y-5 border-border/60">
        <h2 className="font-semibold text-foreground">Endereço</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CEP">
            <Input
              value={address.zip_code}
              onChange={(e) => updAddress({ zip_code: e.target.value })}
              placeholder="00000-000"
            />
          </Field>
          <Field label="Logradouro" className="sm:col-span-2">
            <Input
              value={address.street_name}
              onChange={(e) => updAddress({ street_name: e.target.value })}
              placeholder="Rua, Avenida..."
            />
          </Field>
          <Field label="Número">
            <Input
              value={address.number}
              onChange={(e) => updAddress({ number: e.target.value })}
              placeholder="123"
            />
          </Field>
          <Field label="Complemento">
            <Input
              value={address.complement}
              onChange={(e) => updAddress({ complement: e.target.value })}
              placeholder="Sala, Apto (opcional)"
            />
          </Field>
          <Field label="Bairro">
            <Input
              value={address.district}
              onChange={(e) => updAddress({ district: e.target.value })}
            />
          </Field>
          <Field label="Cidade">
            <Input value={address.city} onChange={(e) => updAddress({ city: e.target.value })} />
          </Field>
          <Field label="Estado">
            <Input
              value={address.state}
              onChange={(e) => updAddress({ state: e.target.value })}
              placeholder="SP"
              maxLength={2}
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            "Salvar endereço"
          )}
        </Button>
      </div>
    </div>
  );
}

function StatusButton({
  active,
  destructive,
  label,
  onClick,
}: {
  active: boolean;
  destructive?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className={
        active && destructive
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : ""
      }
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
