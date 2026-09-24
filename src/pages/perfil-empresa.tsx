import { useState, useEffect, useRef, type ReactNode } from "react";
import { Building2, CheckCircle2, CircleAlert, Loader2, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getAddress,
  getCompanyInformation,
  getCountries,
  saveAddress,
  saveCompanyInformation,
  validateCompanyInformation,
} from "@/services/api";
import {
  getCountryValueForNewDraft,
  hasBrazilianAddressCountryMismatch,
  type CountryReference,
} from "@/features/campaign-creation/opportunity-creation";
import {
  COMPANY_STATUS_LABEL,
  EMPTY_COMPANY,
  companyFormMatches,
  companySavePayload,
  readCompanyInformation,
  toCompanyForm,
  type CompanyForm,
  type CompanyInformation,
} from "@/features/company-information/company-information";
import { lookupCep } from "@/utils/brasil-api";
import {
  formatBrazilPhone,
  formatCep,
  formatCnpj,
  isValidCepShape,
  isValidCnpjShape,
  isValidPhoneShape,
  onlyDigits,
} from "@/utils/br-formatters";

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

type CompanyNotice = {
  kind: "info" | "error";
  title: string;
  description: string;
};

const EMPTY_ADDRESS: AddressForm = {
  country_id: 0,
  state: "",
  city: "",
  district: "",
  zip_code: "",
  street_name: "",
  number: "",
  complement: "",
};

const UF_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

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

function getErrorMessage(error: unknown, fallback = "Não foi possível salvar o endereço. Tente novamente.") {
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

  return fallback;
}

function getAddressData(response: unknown): Partial<AddressForm> | null {
  if (!response || typeof response !== "object") return null;

  const candidate = response as { data?: unknown };
  const data = candidate.data ?? response;

  return data && typeof data === "object" ? (data as Partial<AddressForm>) : null;
}

function toAddressForm(data: Partial<AddressForm>): AddressForm {
  return {
    country_id: data.country_id ?? 0,
    state: data.state ?? "",
    city: data.city ?? "",
    district: data.district ?? "",
    zip_code: data.zip_code ?? "",
    street_name: data.street_name ?? "",
    number: data.number ?? "",
    complement: data.complement ?? "",
  };
}

function readCountries(response: unknown): CountryReference[] {
  const data = response && typeof response === "object" && "data" in response
    ? (response as { data: unknown }).data
    : null;
  return Array.isArray(data)
    ? data.filter((item): item is CountryReference =>
        item !== null && typeof item === "object" &&
        Number.isInteger(item.id) && item.id > 0 && typeof item.name === "string")
    : [];
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
  const [countries, setCountries] = useState<CountryReference[]>([]);
  const [company, setCompany] = useState<CompanyForm>(EMPTY_COMPANY);
  const [persistedCompany, setPersistedCompany] = useState<CompanyInformation | null>(null);
  const [companyLoadError, setCompanyLoadError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyLookupLoading, setCompanyLookupLoading] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyNotice, setCompanyNotice] = useState<CompanyNotice | null>(null);
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "found" | "missing" | "error">("idle");
  const lastRequestedCepRef = useRef("");
  const addressRef = useRef(address);

  const cnpjIsFilled = onlyDigits(company.cnpj).length > 0;
  const cnpjIsValid = isValidCnpj(company.cnpj);
  const companyIsSaved = companyFormMatches(persistedCompany, company);
  const selectedCountry = countries.find((country) => country.id === address.country_id) ?? null;
  const countryMismatch = hasBrazilianAddressCountryMismatch(
    selectedCountry, address.zip_code, address.state,
  );

  useEffect(() => {
    Promise.allSettled([getAddress(), getCompanyInformation(), getCountries()]).then(([addressResult, companyResult, countriesResult]) => {
      const loadedCountries = countriesResult.status === "fulfilled"
        ? readCountries(countriesResult.value)
        : [];
      setCountries(loadedCountries);
      if (addressResult.status === "fulfilled") {
        const persistedAddress = getAddressData(addressResult.value);
        if (persistedAddress) {
          const nextAddress = toAddressForm(persistedAddress);
          setAddress({
            ...nextAddress,
            country_id: nextAddress.country_id || Number(getCountryValueForNewDraft(loadedCountries)),
          });
          setSaved(hasConfirmedAddress(persistedAddress));
        } else {
          setAddress((current) => ({
            ...current,
            country_id: Number(getCountryValueForNewDraft(loadedCountries)),
          }));
        }
      }
      if (companyResult.status === "fulfilled") {
        try {
          const persisted = readCompanyInformation(companyResult.value);
          setPersistedCompany(persisted);
          setCompany(toCompanyForm(persisted));
        } catch {
          setCompanyLoadError(true);
        }
      } else {
        setCompanyLoadError(true);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  useEffect(() => {
    const digits = onlyDigits(address.zip_code);

    if (digits.length === 0) {
      lastRequestedCepRef.current = "";
      setCepStatus("idle");
      return;
    }

    if (digits.length < 8) {
      lastRequestedCepRef.current = "";
      setCepStatus("missing");
      return;
    }

    if (lastRequestedCepRef.current === digits) return;

    lastRequestedCepRef.current = digits;

    const controller = new AbortController();
    const currentAddress = addressRef.current;
    const snapshot = {
      state: currentAddress.state,
      city: currentAddress.city,
      district: currentAddress.district,
      street_name: currentAddress.street_name,
    };

    setCepStatus("loading");

    lookupCep(digits, controller.signal)
      .then((result) => {
        if (!result) {
          setCepStatus("error");
          return;
        }

        setAddress((current) => ({
          ...current,
          state: snapshot.state || result.state || current.state,
          city: snapshot.city || result.city || current.city,
          district: snapshot.district || result.neighborhood || current.district,
          street_name: snapshot.street_name || result.street || current.street_name,
        }));
        setCepStatus("found");
      })
      .catch((error) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setCepStatus("error");
        }
      });

    return () => controller.abort();
  }, [address.zip_code]);

  const updAddress = (patch: Partial<AddressForm>) => {
    setSaved(false);
    setAddress((current) => ({ ...current, ...patch }));
  };

  const updCompany = (patch: Partial<CompanyForm>) => {
    setCompany((current) => ({ ...current, ...patch }));
    setCompanyNotice(null);
  };

  const reloadCompany = async () => {
    const persisted = readCompanyInformation(await getCompanyInformation());
    setPersistedCompany(persisted);
    setCompany(toCompanyForm(persisted));
    setCompanyLoadError(false);
    return persisted;
  };

  const handleSaveCompany = async () => {
    if (!cnpjIsValid || !company.legal_name.trim()) {
      toast.error("Informe um CNPJ válido e a razão social.");
      return;
    }
    setCompanySaving(true);
    setCompanyNotice(null);
    try {
      const payload = companySavePayload(company);
      await saveCompanyInformation(payload);
      const persisted = readCompanyInformation(await getCompanyInformation());
      if (!persisted || !companyFormMatches(persisted, company)) {
        throw new Error("Dados enviados, mas o readback da empresa não confirmou o salvamento.");
      }
      setPersistedCompany(persisted);
      setCompany(toCompanyForm(persisted));
      toast.success("Dados da empresa salvos e confirmados.");
    } catch (error) {
      setCompanyNotice({
        kind: "error",
        title: "Salvamento não confirmado",
        description: getErrorMessage(error, "Não foi possível salvar ou confirmar os dados da empresa."),
      });
    } finally {
      setCompanySaving(false);
    }
  };

  const handleValidateCompany = async () => {
    if (!cnpjIsValid) {
      setCompanyNotice({
        kind: "error",
        title: "CNPJ inválido",
        description: "Revise os números e o dígito verificador antes de validar.",
      });
      return;
    }

    if (!companyIsSaved) {
      setCompanyNotice({
        kind: "error",
        title: "Salve a empresa primeiro",
        description: "A validação da API usa o CNPJ já salvo. Salve os dados e tente novamente.",
      });
      return;
    }

    setCompanyLookupLoading(true);
    try {
      await validateCompanyInformation();
      const persisted = await reloadCompany();
      setCompanyNotice({
        kind: "info",
        title: "Consulta concluída",
        description: persisted
          ? `Status registrado pela API: ${COMPANY_STATUS_LABEL[persisted.validation_status] ?? persisted.validation_status}.`
          : "A API não retornou uma empresa salva. Recarregue e tente novamente.",
      });
    } catch (error) {
      setCompanyNotice({
        kind: "error",
        title: "Validação não confirmada",
        description: getErrorMessage(error, "Não foi possível validar o CNPJ na API."),
      });
    } finally {
      setCompanyLookupLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isValidCepShape(address.zip_code) || !address.street_name || !address.city || !address.state) {
      return toast.error("Preencha CEP, logradouro, cidade e estado");
    }
    if (!selectedCountry) return toast.error("Selecione um país válido antes de salvar o endereço.");
    if (countryMismatch) {
      return toast.error("O país cadastrado não combina com o CEP e a UF brasileiros. Revise o país.");
    }
    setSaving(true);
    try {
      await saveAddress({
        ...address,
        complement: address.complement || null,
      });
      const persisted = getAddressData(await getAddress());

      if (!hasConfirmedAddress(persisted) || persisted.country_id !== address.country_id) {
        throw new Error(
          "Endereço ou país enviado não foi confirmado pela API. Recarregue a página e tente novamente.",
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
          {persistedCompany && companyIsSaved && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Empresa salva
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
              CNPJ e dados empresariais canônicos da sua conta. Salve as alterações antes de
              validar o CNPJ na API.
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
              disabled={companyLoadError || companySaving || companyLookupLoading}
            />
          </Field>
          <Button type="button" variant="outline" onClick={handleValidateCompany} disabled={companyLoadError || companySaving || companyLookupLoading}>
            {companyLookupLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {companyLookupLoading ? "Consultando..." : "Validar na API"}
          </Button>
        </div>
        {company.cnpj && (
          <FieldHint
            valid={isValidCnpjShape(company.cnpj)}
            message={
              isValidCnpjShape(company.cnpj)
                ? "CNPJ completo; o dígito verificador é conferido ao salvar."
                : `${onlyDigits(company.cnpj).length}/14 dígitos.`
            }
          />
        )}

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

        {companyLoadError && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Empresa não carregada</AlertTitle>
            <AlertDescription>
              Não é seguro salvar antes de ler o registro atual. <Button type="button" variant="link" className="h-auto p-0" onClick={() => void reloadCompany().catch(() => toast.error("A leitura da empresa continua indisponível."))}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Razão social">
            <Input
              value={company.legal_name}
              onChange={(e) => updCompany({ legal_name: e.target.value })}
              placeholder="Nome jurídico da empresa"
              disabled={companyLoadError || companySaving || companyLookupLoading}
            />
          </Field>
          <Field label="Nome fantasia">
            <Input
              value={company.trade_name}
              onChange={(e) => updCompany({ trade_name: e.target.value })}
              placeholder="Nome comercial"
              disabled={companyLoadError || companySaving || companyLookupLoading}
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={company.phone}
              onChange={(e) => updCompany({ phone: formatBrazilPhone(e.target.value) })}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              disabled={companyLoadError || companySaving || companyLookupLoading}
            />
            {company.phone && (
              <FieldHint
                valid={isValidPhoneShape(company.phone)}
                message={
                  isValidPhoneShape(company.phone)
                    ? "Telefone completo."
                    : `${onlyDigits(company.phone).length}/11 dígitos.`
                }
              />
            )}
          </Field>
          <Field label="E-mail">
            <Input
              value={company.email}
              onChange={(e) => updCompany({ email: e.target.value })}
              placeholder="empresa@exemplo.com"
              type="email"
              disabled={companyLoadError || companySaving || companyLookupLoading}
            />
          </Field>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Status operacional
          </Label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Badge variant="secondary">
              {persistedCompany && companyIsSaved
                ? COMPANY_STATUS_LABEL[persistedCompany.validation_status] ?? persistedCompany.validation_status
                : persistedCompany ? "Alterações não salvas" : "Empresa ainda não cadastrada"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {persistedCompany?.validated_at
                ? `Última validação: ${new Date(persistedCompany.validated_at).toLocaleString("pt-BR")}.`
                : "O status operacional é retornado pela API e não pode ser editado manualmente."}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSaveCompany} disabled={companyLoadError || companySaving || companyLookupLoading || companyIsSaved}>
            {companySaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {companySaving ? "Salvando..." : "Salvar empresa"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-5 border-border/60">
        <h2 className="font-semibold text-foreground">Endereço</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="País" className="sm:col-span-2">
            <SearchableCombobox
              id="profile-country"
              value={address.country_id > 0 ? String(address.country_id) : ""}
              onValueChange={(value) => updAddress({ country_id: Number(value) })}
              options={countries.map((country) => ({
                value: String(country.id),
                label: country.name,
                keywords: country.abbreviation ?? "",
              }))}
              placeholder="Selecione o país"
              searchPlaceholder="Buscar país..."
              disabled={countries.length === 0}
              aria-invalid={!selectedCountry || countryMismatch}
            />
            {countries.length === 0 && (
              <FieldHint valid={false} message="Não foi possível carregar os países. Aguarde ou recarregue a página." />
            )}
            {countryMismatch && (
              <FieldHint
                valid={false}
                message={`O perfil informa ${selectedCountry?.name}, mas o CEP e a UF têm formato brasileiro. Confirme o país antes de salvar o endereço ou criar uma oportunidade.`}
              />
            )}
          </Field>
          <Field label="CEP">
            <Input
              value={address.zip_code}
              onChange={(e) => updAddress({ zip_code: formatCep(e.target.value) })}
              placeholder="00000-000"
              inputMode="numeric"
              aria-invalid={cepStatus === "missing"}
            />
            {cepStatus === "missing" && (
              <FieldHint
                valid={false}
                message={`${onlyDigits(address.zip_code).length}/8 dígitos. Complete o CEP para buscar o endereço.`}
              />
            )}
            {cepStatus === "loading" && <FieldHint valid message="Buscando endereço na BrasilAPI..." />}
            {cepStatus === "found" && <FieldHint valid message="CEP encontrado. Campos vazios foram preenchidos." />}
            {cepStatus === "error" && (
              <FieldHint
                valid={false}
                message="Não foi possível consultar o CEP agora. Preencha o endereço manualmente."
              />
            )}
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
            <Select value={address.state} onValueChange={(state) => updAddress({ state })}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {UF_OPTIONS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving || !selectedCountry || countryMismatch}>
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

function FieldHint({ valid, message }: { valid: boolean; message: string }) {
  return (
    <p className={`text-xs leading-relaxed ${valid ? "text-emerald-700" : "text-destructive"}`}>
      {message}
    </p>
  );
}
