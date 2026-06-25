import { useRef } from "react";
import { Upload, CheckCircle2, FileText, Trash2, AlertCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { mockStore, useMock, type DocItem } from "@/lib/mock-store";

const CATEGORIES: Record<DocItem["category"], string> = {
  empresa: "Empresa",
  financeiro: "Financeiro",
  pessoal: "Pessoal",
  juridico: "Jurídico",
};

export default function DocsPage() {
  const docs = useMock(() => mockStore.getDocs());

  const required = docs.filter((d) => d.required);
  const done = required.filter((d) => d.status !== "missing").length;
  const pct = Math.round((done / required.length) * 100);
  const ready = pct === 100;

  const handleFile = (id: string, file: File) => {
    const next = docs.map((d) => d.id === id ? { ...d, status: "uploaded" as const, file_name: file.name, uploaded_at: new Date().toISOString() } : d);
    mockStore.setDocs(next);
    toast.success(`${file.name} enviado`);
  };

  const handleRemove = (id: string) => {
    const next = docs.map((d) => d.id === id ? { ...d, status: "missing" as const, file_name: undefined, uploaded_at: undefined } : d);
    mockStore.setDocs(next);
  };

  const grouped = (Object.keys(CATEGORIES) as DocItem["category"][]).map((cat) => ({
    cat,
    items: docs.filter((d) => d.category === cat),
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Documentação CVM 88</h1>
        <p className="text-muted-foreground mt-1">Envie os documentos exigidos para iniciar sua captação.</p>
      </header>

      <Card className="p-6 border-border/60" style={{ background: "var(--gradient-subtle)" }}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              {ready ? <Sparkles className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {ready ? "Documentação completa!" : `Faltam ${required.length - done} documento(s) obrigatório(s)`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {ready ? "Sua startup está apta a iniciar uma campanha de captação." : "Envie todos os obrigatórios para liberar a criação de campanha."}
              </p>
            </div>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-sm mb-1 text-muted-foreground"><span>{done}/{required.length}</span><span>{pct}%</span></div>
            <Progress value={pct} className="h-2.5" />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {grouped.map(({ cat, items }) => (
          <section key={cat}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{CATEGORIES[cat]}</h3>
            <div className="space-y-2">
              {items.map((doc) => (
                <DocRow key={doc.id} doc={doc} onUpload={(f) => handleFile(doc.id, f)} onRemove={() => handleRemove(doc.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function DocRow({ doc, onUpload, onRemove }: { doc: DocItem; onUpload: (f: File) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploaded = doc.status !== "missing";

  return (
    <Card className="p-4 border-border/60 flex items-center gap-4 transition-colors hover:bg-muted/30">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
        {uploaded ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{doc.name}</span>
          {doc.required ? <Badge variant="outline" className="text-xs">Obrigatório</Badge> : <Badge variant="secondary" className="text-xs">Opcional</Badge>}
        </div>
        <p className="text-sm text-muted-foreground truncate">{uploaded ? doc.file_name : doc.description}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      {uploaded ? (
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      ) : (
        <Button size="sm" onClick={() => inputRef.current?.click()} variant="outline">
          <Upload className="w-4 h-4 mr-2" /> Enviar
        </Button>
      )}
    </Card>
  );
}
