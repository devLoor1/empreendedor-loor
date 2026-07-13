export type UploadValidationOptions = {
  allowedExtensions: string[];
  maxSizeBytes: number;
  emptyMessage?: string;
  invalidTypeMessage?: string;
  maxSizeMessage?: string;
};

export type UploadValidationResult = {
  file: File | null;
  error: string | null;
};

export function normalizeUploadFilename(file: File) {
  const dotIndex = file.name.lastIndexOf(".");

  if (dotIndex <= 0) return file;

  const base = file.name.slice(0, dotIndex);
  const extension = file.name.slice(dotIndex + 1).toLowerCase();
  const normalizedName = `${base}.${extension}`;

  if (normalizedName === file.name) return file;

  return new File([file], normalizedName, { type: file.type, lastModified: file.lastModified });
}

export function getUploadExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function formatUploadSize(bytes: number) {
  if (bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateUploadFile(file: File | undefined, options: UploadValidationOptions) {
  if (!file || file.size <= 0) {
    return { file: null, error: options.emptyMessage || "Selecione um arquivo válido." };
  }

  const normalized = normalizeUploadFilename(file);
  const extension = getUploadExtension(normalized.name);

  if (!options.allowedExtensions.includes(extension)) {
    return {
      file: null,
      error: options.invalidTypeMessage || "Formato de arquivo não aceito.",
    };
  }

  if (normalized.size > options.maxSizeBytes) {
    return {
      file: null,
      error: options.maxSizeMessage || `O arquivo deve ter até ${formatUploadSize(options.maxSizeBytes)}.`,
    };
  }

  return { file: normalized, error: null };
}

export function getUploadAccept(extensions: string[]) {
  return extensions.map((extension) => `.${extension}`).join(",");
}
