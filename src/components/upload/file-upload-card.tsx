import { AlertCircle, CheckCircle2, FileText, Image, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatUploadSize } from "@/utils/upload-validation";

type SelectedFileCardProps = {
  file: File;
  previewUrl?: string;
  imageAlt?: string;
  status?: string;
  onRemove?: () => void;
};

type FileUploadCardProps = {
  id: string;
  accept: string;
  title: string;
  description: string;
  file?: File | null;
  previewUrl?: string;
  imageAlt?: string;
  error?: string | null;
  status?: string;
  disabled?: boolean;
  inputClassName?: string;
  onFile: (file: File | undefined) => void;
  onRemove?: () => void;
};

export function SelectedFileCard({
  file,
  previewUrl,
  imageAlt = "Prévia do arquivo selecionado",
  status = "Pronto para envio",
  onRemove,
}: SelectedFileCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={imageAlt}
          className="h-16 w-16 shrink-0 rounded-md border border-border object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatUploadSize(file.size)}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {status}
        </p>
      </div>

      {onRemove && (
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
          Remover
        </Button>
      )}
    </div>
  );
}

export function FileUploadCard({
  id,
  accept,
  title,
  description,
  file,
  previewUrl,
  imageAlt,
  error,
  status,
  disabled,
  inputClassName,
  onFile,
  onRemove,
}: FileUploadCardProps) {
  return (
    <div className="space-y-3">
      <Input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        className={cn("sr-only", inputClassName)}
      />
      <Label
        htmlFor={id}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-5 text-center transition-colors hover:border-primary/70",
          disabled && "pointer-events-none opacity-60",
          error && "border-destructive/70 bg-destructive/5",
        )}
      >
        <Upload className="mb-2 h-6 w-6 text-primary" />
        <span className="font-medium text-foreground">{file ? `Trocar ${title}` : title}</span>
        <span className="mt-1 text-xs text-muted-foreground">{description}</span>
      </Label>

      {error && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {file ? (
        <SelectedFileCard
          file={file}
          previewUrl={previewUrl}
          imageAlt={imageAlt}
          status={status}
          onRemove={onRemove}
        />
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          <Image className="h-4 w-4 shrink-0" />
          Nenhum arquivo selecionado.
        </div>
      )}
    </div>
  );
}
