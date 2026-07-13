import { useEffect, useState, type ReactNode } from "react";
import { Camera, CheckCircle2, Loader2, Upload, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUploadCard } from "@/components/upload/file-upload-card";
import { toast } from "sonner";
import {
  getMe,
  getPersonalInformation,
  updateAvatar,
  updatePersonalInformation,
} from "@/services/api";
import { getUploadAccept, validateUploadFile } from "@/utils/upload-validation";
import {
  formatBrazilPhone,
  formatCpf,
  isValidCpfShape,
  isValidPhoneShape,
  onlyDigits,
} from "@/utils/br-formatters";

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
  full_name: "",
  phone: "",
  gender: "",
  cpf: "",
  rg: "",
  issuing_entity: "",
  marital_status: "",
  birth_date: "",
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

const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const AVATAR_EXTENSIONS = ["jpg", "jpeg", "png"];

function formatRg(value: string) {
  return value.toUpperCase().replace(/[^0-9A-Z.-]/g, "").slice(0, 20);
}

function normalizeGender(value: unknown) {
  return typeof value === "string" ? GENDER_VALUE_MAP[value] ?? value : "";
}

function normalizeMaritalStatus(value: unknown) {
  return typeof value === "string" ? MARITAL_STATUS_VALUE_MAP[value] ?? "" : "";
}

function getData(response: unknown): Record<string, unknown> | null {
  if (!response || typeof response !== "object") return null;

  const candidate = response as { data?: unknown };
  const data = candidate.data ?? response;

  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

function getAvatarUrl(response: unknown) {
  const data = getData(response);
  const avatar = data?.avatar || data?.image_url;

  return typeof avatar === "string" ? avatar : "";
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [personalResult, meResult] = await Promise.allSettled([
          getPersonalInformation(),
          getMe(),
        ]);

        if (personalResult.status === "fulfilled") {
          const d = getData(personalResult.value);

          if (d) {
            setData({
              full_name: typeof d.full_name === "string" ? d.full_name : "",
              phone: typeof d.phone === "string" ? formatBrazilPhone(d.phone) : "",
              gender: normalizeGender(d.gender),
              cpf: typeof d.cpf === "string" ? formatCpf(d.cpf) : "",
              rg: typeof d.rg === "string" ? d.rg : "",
              issuing_entity: typeof d.issuing_entity === "string" ? d.issuing_entity : "",
              marital_status: normalizeMaritalStatus(d.marital_status),
              birth_date: d.birth_date ? String(d.birth_date).slice(0, 10) : "",
            });

            if (d.cpf) setSaved(true);
          }
        }

        if (meResult.status === "fulfilled") {
          setAvatarUrl(getAvatarUrl(meResult.value));
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const upd = (patch: Partial<PersonalForm>) => setData((d) => ({ ...d, ...patch }));

  const clearAvatarSelection = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarError(null);
    setAvatarNotice(null);
  };

  const handleAvatarFileSelected = (file: File | undefined) => {
    if (!file) return;

    const result = validateUploadFile(file, {
      allowedExtensions: AVATAR_EXTENSIONS,
      maxSizeBytes: AVATAR_MAX_SIZE,
      invalidTypeMessage: "Use uma imagem PNG, JPG ou JPEG.",
      maxSizeMessage: "A imagem deve ter até 2 MB.",
    });

    if (!result.file) {
      const message = result.error || "Não foi possível usar esta imagem.";
      setAvatarError(message);
      setAvatarNotice(null);
      toast.error(message);
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    setAvatarFile(result.file);
    setAvatarPreview(URL.createObjectURL(result.file));
    setAvatarError(null);
    setAvatarNotice("Imagem pronta. Clique em Enviar avatar para persistir.");
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return toast.error("Escolha uma imagem para enviar.");

    setAvatarSaving(true);

    try {
      const formData = new FormData();
      formData.append("image", avatarFile);
      await updateAvatar(formData);

      const me = await getMe();
      const nextAvatar = getAvatarUrl(me);

      setAvatarUrl(nextAvatar);
      window.dispatchEvent(
        new CustomEvent("entrepreneur-profile-updated", {
          detail: { avatar: nextAvatar, image_url: nextAvatar },
        }),
      );
      clearAvatarSelection();
      setAvatarOpen(false);
      toast.success("Avatar atualizado com sucesso.");
    } catch {
      setAvatarError("Não foi possível atualizar o avatar.");
      setAvatarNotice(null);
      toast.error("Não foi possível atualizar o avatar.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const save = async () => {
    if (!data.full_name || !data.cpf) return toast.error("Nome e CPF são obrigatórios");
    if (!data.phone) return toast.error("Telefone é obrigatório");
    if (!data.gender) return toast.error("Gênero é obrigatório");
    if (!data.marital_status) return toast.error("Estado civil é obrigatório");
    if (!data.birth_date) return toast.error("Data de nascimento é obrigatória");

    setSaving(true);

    try {
      await updatePersonalInformation({
        ...data,
        phone: onlyDigits(data.phone),
        cpf: onlyDigits(data.cpf),
      });
      setSaved(true);
      toast.success("Perfil pessoal salvo com sucesso!");
      window.dispatchEvent(
        new CustomEvent("entrepreneur-profile-updated", {
          detail: { full_name: data.full_name, phone: onlyDigits(data.phone) },
        }),
      );
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
        <Skeleton className="h-32 rounded-xl" />
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

      <Card className="p-6 border-border/60">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-border">
              <AvatarImage src={avatarUrl} alt={data.full_name || "Avatar do empreendedor"} />
              <AvatarFallback>
                <UserRound className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">Avatar do responsável</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A imagem aparece na navegação e ajuda a identificar a sessão. Use PNG/JPG até 2 MB.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => setAvatarOpen(true)}>
            <Camera className="h-4 w-4" />
            Alterar avatar
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-5 border-border/60">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome completo">
            <Input value={data.full_name} onChange={(e) => upd({ full_name: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <Input
              value={data.phone}
              onChange={(e) => upd({ phone: formatBrazilPhone(e.target.value) })}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
            {data.phone && (
              <FieldHint
                valid={isValidPhoneShape(data.phone)}
                message={
                  isValidPhoneShape(data.phone)
                    ? "Telefone completo."
                    : `${onlyDigits(data.phone).length}/11 dígitos. Informe DDD e número.`
                }
              />
            )}
          </Field>
          <Field label="CPF">
            <Input
              value={data.cpf}
              onChange={(e) => upd({ cpf: formatCpf(e.target.value) })}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            {data.cpf && (
              <FieldHint
                valid={isValidCpfShape(data.cpf)}
                message={
                  isValidCpfShape(data.cpf)
                    ? "CPF completo."
                    : `${onlyDigits(data.cpf).length}/11 dígitos.`
                }
              />
            )}
          </Field>
          <Field label="RG">
            <Input value={data.rg} onChange={(e) => upd({ rg: formatRg(e.target.value) })} />
          </Field>
          <Field label="Órgão emissor">
            <Input
              value={data.issuing_entity}
              onChange={(e) => upd({ issuing_entity: e.target.value.toUpperCase() })}
              placeholder="SSP/SP"
            />
          </Field>
          <Field label="Data de nascimento">
            <Input
              type="date"
              value={data.birth_date}
              onChange={(e) => upd({ birth_date: e.target.value })}
            />
          </Field>
          <Field label="Gênero">
            <Select value={data.gender} onValueChange={(v) => upd({ gender: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="another">Outro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado civil">
            <Select
              value={data.marital_status}
              onValueChange={(v) => upd({ marital_status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
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
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            "Salvar perfil pessoal"
          )}
        </Button>
      </div>

      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar avatar</DialogTitle>
            <DialogDescription>
              Escolha uma imagem e confira a prévia circular antes de enviar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              {avatarPreview || avatarUrl ? (
                <img
                  src={avatarPreview || avatarUrl}
                  alt="Prévia do avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <FileUploadCard
              id="avatarFile"
              accept={getUploadAccept(AVATAR_EXTENSIONS)}
              title="Selecionar avatar"
              description="PNG, JPG ou JPEG até 2 MB. O upload acontece apenas ao clicar em Enviar avatar."
              file={avatarFile}
              previewUrl={avatarPreview}
              imageAlt="Prévia do avatar selecionado"
              error={avatarError}
              status={avatarNotice || "Imagem pronta para envio"}
              onFile={handleAvatarFileSelected}
              onRemove={clearAvatarSelection}
            />
            <p className="text-xs text-muted-foreground">
              A extensão final do arquivo é normalizada para lowercase antes do upload.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAvatarOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAvatarUpload} disabled={!avatarFile || avatarSaving}>
              {avatarSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Enviar avatar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
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
