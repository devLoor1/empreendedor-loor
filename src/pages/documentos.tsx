import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUploadCard } from "@/components/upload/file-upload-card";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import {
  getEntrepreneurDocuments,
  replaceEntrepreneurDocument,
  uploadEntrepreneurDocument,
} from "@/services/api";
import {
  getUploadAccept,
  normalizeUploadFilename,
  validateUploadFile,
} from "@/utils/upload-validation";

type DocumentType =
  | "social_contract"
  | "cnpj_card"
  | "balance_sheet"
  | "income_statement"
  | "business_plan"
  | "valuation_memo"
  | "partners_id"
  | "address_proof"
  | "negative_certificates"
  | "offer_approval_minutes"
  | "adhesion_term"
  | "pitch_deck";

type DocumentCategory = "Empresa" | "Financeiro" | "Jurídico" | "Oferta";

type DocumentConfig = {
  type: DocumentType;
  name: string;
  category: DocumentCategory;
  description: string;
};

type DocumentRecord = {
  id: number;
  name?: string;
  type: DocumentType;
  download_link?: string;
  created_at?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "docx", "xlsx"];

const DOCUMENTS: DocumentConfig[] = [
  {
    type: "social_contract",
    name: "Contrato social",
    category: "Empresa",
    description: "Contrato ou última alteração consolidada.",
  },
  {
    type: "cnpj_card",
    name: "Cartão CNPJ",
    category: "Empresa",
    description: "Comprovante público de inscrição da empresa.",
  },
  {
    type: "partners_id",
    name: "Documentos dos sócios",
    category: "Empresa",
    description: "Identificação dos responsáveis autorizados.",
  },
  {
    type: "address_proof",
    name: "Comprovante de endereço",
    category: "Empresa",
    description: "Comprovante da sede ou endereço operacional.",
  },
  {
    type: "balance_sheet",
    name: "Balanço patrimonial",
    category: "Financeiro",
    description: "Balanço ou demonstrativo equivalente.",
  },
  {
    type: "income_statement",
    name: "DRE",
    category: "Financeiro",
    description: "Demonstração de resultado do exercício.",
  },
  {
    type: "business_plan",
    name: "Plano de negócios",
    category: "Oferta",
    description: "Documento de estratégia, operação e uso de recursos.",
  },
  {
    type: "valuation_memo",
    name: "Memorando de valuation",
    category: "Oferta",
    description: "Premissas de valuation ou precificação da oportunidade.",
  },
  {
    type: "negative_certificates",
    name: "Certidões negativas",
    category: "Jurídico",
    description: "Certidões e evidências jurídicas relevantes.",
  },
  {
    type: "offer_approval_minutes",
    name: "Ata de aprovação da oferta",
    category: "Jurídico",
    description: "Ata ou deliberação interna autorizando a captação.",
  },
  {
    type: "adhesion_term",
    name: "Termo de adesão",
    category: "Jurídico",
    description: "Termo ou aceite operacional relacionado à oferta.",
  },
  {
    type: "pitch_deck",
    name: "Pitch deck",
    category: "Oferta",
    description: "Apresentação opcional da empresa ou oportunidade.",
  },
];

function getDataArray(response: unknown): DocumentRecord[] {
  if (!response || typeof response !== "object") return [];

  const data = (response as { data?: unknown }).data;

  return Array.isArray(data) ? (data as DocumentRecord[]) : [];
}

function formatDate(value?: string) {
  if (!value) return "Data não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function DocsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentConfig | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const documentsByType = useMemo(
    () => new Map(documents.map((doc) => [doc.type, doc] as const)),
    [documents],
  );
  const uploadedCount = DOCUMENTS.filter((doc) => documentsByType.has(doc.type)).length;
  const progress = Math.round((uploadedCount / DOCUMENTS.length) * 100);

  async function loadDocuments() {
    setLoading(true);

    try {
      setDocuments(getDataArray(await getEntrepreneurDocuments()));
    } catch {
      toast.error("Não foi possível carregar documentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSelectFile = (file: File | undefined) => {
    if (!file) return;

    const result = validateUploadFile(file, {
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxSizeBytes: MAX_FILE_SIZE,
      invalidTypeMessage: "Use PDF, PNG, JPG, JPEG, DOCX ou XLSX.",
      maxSizeMessage: "O arquivo deve ter até 10 MB.",
    });

    if (!result.file) {
      const message = result.error || "Não foi possível usar este arquivo.";
      setUploadError(message);
      setUploadNotice(null);
      toast.error(message);
      return;
    }

    setSelectedFile(result.file);
    setUploadError(null);
    setUploadNotice("Arquivo pronto. Confirme o envio para persistir no backend.");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleSelectFile(event.dataTransfer.files?.[0]);
  };

  const openUpload = (document: DocumentConfig) => {
    setSelectedDocument(document);
    setSelectedFile(null);
    setUploadError(null);
    setUploadNotice(null);
  };

  const closeUpload = () => {
    setSelectedDocument(null);
    setSelectedFile(null);
    setUploadError(null);
    setUploadNotice(null);
  };

  const handleUpload = async () => {
    if (!selectedDocument || !selectedFile) return toast.error("Escolha um arquivo.");

    setSaving(true);

    try {
      const current = documentsByType.get(selectedDocument.type);
      const formData = new FormData();
      formData.append("file", normalizeUploadFilename(selectedFile));

      if (current) {
        await replaceEntrepreneurDocument(current.id, formData);
      } else {
        formData.append("type", selectedDocument.type);
        await uploadEntrepreneurDocument(formData);
      }

      toast.success(current ? "Documento substituído." : "Documento enviado.");
      setSelectedDocument(null);
      setSelectedFile(null);
      setUploadError(null);
      setUploadNotice(null);
      await loadDocuments();
    } catch {
      setUploadError("Não foi possível enviar o documento.");
      setUploadNotice(null);
      toast.error("Não foi possível enviar o documento.");
    } finally {
      setSaving(false);
    }
  };

  const grouped = (["Empresa", "Financeiro", "Jurídico", "Oferta"] as DocumentCategory[]).map(
    (category) => ({
      category,
      items: DOCUMENTS.filter((document) => document.category === category),
    }),
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Documentação CVM 88</h1>
        <p className="text-muted-foreground mt-1">
          Anexe documentos opcionais para organizar o dossiê. Eles não bloqueiam cadastro nem
          criação de campanha neste ciclo.
        </p>
      </header>

      <Alert className="border-border/60">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Envio opcional</AlertTitle>
        <AlertDescription>
          O contrato atual permite envio e substituição de documentos. A ausência de anexos não
          impede a criação da oportunidade.
        </AlertDescription>
      </Alert>

      <Card className="p-6 border-border/60" style={{ background: "var(--gradient-subtle)" }}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {uploadedCount} de {DOCUMENTS.length} documento(s) anexado(s)
              </h2>
              <p className="text-sm text-muted-foreground">
                Use esta área como repositório de apoio para análise futura.
              </p>
            </div>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-sm mb-1 text-muted-foreground">
              <span>{uploadedCount}/{DOCUMENTS.length}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>
        </div>
      </Card>

      {uploadedCount === 0 && (
        <EmptyState
          icon={FileText}
          title="Nenhum documento anexado"
          description="Os documentos são opcionais neste fluxo. Use esta área para preparar um dossiê de apoio sem bloquear a criação de campanha."
          action={
            <Button type="button" variant="outline" onClick={() => openUpload(DOCUMENTS[0])}>
              <Upload className="h-4 w-4" />
              Enviar primeiro documento
            </Button>
          }
        />
      )}

      <div className="space-y-6">
        {grouped.map(({ category, items }) => (
          <section key={category}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((document) => {
                const uploaded = documentsByType.get(document.type);

                return (
                  <DocRow
                    key={document.type}
                    document={document}
                    uploaded={uploaded}
                    onUpload={() => openUpload(document)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={Boolean(selectedDocument)} onOpenChange={(open) => !open && closeUpload()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              Envie ou substitua este documento. O arquivo será persistido no backend.
            </DialogDescription>
          </DialogHeader>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <FileUploadCard
              id="documentUploadFile"
              accept={getUploadAccept(ALLOWED_EXTENSIONS)}
              title="Selecionar documento"
              description="PDF, PNG, JPG, JPEG, DOCX ou XLSX até 10 MB. Também é possível arrastar o arquivo aqui."
              file={selectedFile}
              error={uploadError}
              status={uploadNotice || "Arquivo pronto para envio"}
              onFile={handleSelectFile}
              onRemove={() => {
                setSelectedFile(null);
                setUploadError(null);
                setUploadNotice(null);
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeUpload}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleUpload} disabled={!selectedFile || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Confirmar envio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocRow({
  document,
  uploaded,
  onUpload,
}: {
  document: DocumentConfig;
  uploaded?: DocumentRecord;
  onUpload: () => void;
}) {
  return (
    <Card className="p-4 border-border/60 flex flex-col gap-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          uploaded ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        {uploaded ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{document.name}</span>
          <Badge variant={uploaded ? "secondary" : "outline"} className="text-xs">
            {uploaded ? "Anexado" : "Opcional"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{document.description}</p>
        {uploaded && (
          <p className="mt-1 text-xs text-muted-foreground">
            Último envio: {formatDate(uploaded.created_at)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {uploaded?.download_link && (
          <Button asChild variant="ghost" size="sm">
            <a href={uploaded.download_link} target="_blank" rel="noreferrer">
              <Download className="w-4 h-4" />
              Baixar
            </a>
          </Button>
        )}
        <Button size="sm" onClick={onUpload} variant="outline">
          <Upload className="w-4 h-4" />
          {uploaded ? "Substituir" : "Enviar"}
        </Button>
      </div>
    </Card>
  );
}
