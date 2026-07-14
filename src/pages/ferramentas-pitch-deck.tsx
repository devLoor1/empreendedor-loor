import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createEntrepreneurPitchDeck,
  generateEntrepreneurPitchDeck,
  generateEntrepreneurPitchDeckPdf,
  getEntrepreneurPitchDecks,
  updateEntrepreneurPitchDeck,
  type EntrepreneurPitchDeck,
  type EntrepreneurPitchDeckInput,
} from "@/services/api";
import { cn } from "@/lib/utils";

type PitchForm = Required<Omit<EntrepreneurPitchDeckInput, "generated_content">>;
type PitchFieldKey = keyof PitchForm;

const pitchFields: Array<{
  key: PitchFieldKey;
  label: string;
  placeholder: string;
  rows?: number;
}> = [
  {
    key: "description",
    label: "Descrição da empresa",
    placeholder: "O que a empresa faz, para quem vende e em qual estágio está.",
    rows: 3,
  },
  {
    key: "problem",
    label: "Problema",
    placeholder: "Qual dor do mercado a empresa resolve.",
  },
  {
    key: "solution",
    label: "Solução",
    placeholder: "Como o produto ou serviço resolve o problema.",
  },
  {
    key: "market",
    label: "Mercado",
    placeholder: "Tamanho, público e oportunidade de crescimento.",
  },
  {
    key: "product",
    label: "Produto",
    placeholder: "Principais diferenciais, funcionalidades ou proposta de valor.",
  },
  {
    key: "business_model",
    label: "Modelo de negócio",
    placeholder: "Como a empresa gera receita.",
  },
  {
    key: "traction",
    label: "Tração",
    placeholder: "Receita, clientes, contratos, crescimento ou marcos relevantes.",
  },
  {
    key: "team",
    label: "Time",
    placeholder: "Fundadores, lideranças e competências principais.",
  },
  {
    key: "financial",
    label: "Financeiro",
    placeholder: "Indicadores financeiros, projeções ou estrutura de custos.",
  },
  {
    key: "fundraising",
    label: "Captação",
    placeholder: "Valor buscado, uso dos recursos e tese da rodada.",
  },
];

const emptyPitchForm: PitchForm = {
  description: "",
  problem: "",
  solution: "",
  market: "",
  product: "",
  business_model: "",
  traction: "",
  team: "",
  financial: "",
  fundraising: "",
};

function deckToForm(deck: EntrepreneurPitchDeck): PitchForm {
  return {
    description: deck.description ?? "",
    problem: deck.problem ?? "",
    solution: deck.solution ?? "",
    market: deck.market ?? "",
    product: deck.product ?? "",
    business_model: deck.business_model ?? "",
    traction: deck.traction ?? "",
    team: deck.team ?? "",
    financial: deck.financial ?? "",
    fundraising: deck.fundraising ?? "",
  };
}

function normalizeForm(form: PitchForm): EntrepreneurPitchDeckInput {
  return Object.entries(form).reduce((payload, [key, value]) => {
    payload[key as PitchFieldKey] = value.trim() || null;
    return payload;
  }, {} as EntrepreneurPitchDeckInput);
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }

    const errors = (error as { errors?: Array<{ message?: unknown }> }).errors;
    const firstMessage = errors?.find((item) => typeof item.message === "string")?.message;
    if (typeof firstMessage === "string" && firstMessage.trim()) {
      return firstMessage;
    }
  }

  return "Não foi possível concluir a operação.";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Data indisponível";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ToolsPitchDeckPage() {
  const [decks, setDecks] = useState<EntrepreneurPitchDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
  const [form, setForm] = useState<PitchForm>(emptyPitchForm);
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? null,
    [activeDeckId, decks],
  );

  const completedFields = useMemo(
    () => pitchFields.filter((field) => form[field.key].trim()).length,
    [form],
  );

  const loadDecks = useCallback(async (selectId?: number | null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getEntrepreneurPitchDecks();
      const nextDecks = response.data ?? [];
      setDecks(nextDecks);

      setActiveDeckId((current) => {
        if (selectId !== undefined) return selectId;
        if (!current && nextDecks[0]) return nextDecks[0].id;
        return current;
      });
    } catch {
      setError("Não foi possível carregar os pitch decks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    if (!activeDeck) return;

    setForm(deckToForm(activeDeck));
    setGeneratedText(activeDeck.generated_content ?? "");
  }, [activeDeck]);

  const startNewDraft = () => {
    setActiveDeckId(null);
    setForm(emptyPitchForm);
    setGeneratedText("");
    setPrompt("");
  };

  const saveDraft = async (options?: { silent?: boolean }) => {
    setSaving(true);

    try {
      const payload = normalizeForm(form);

      if (activeDeckId) {
        await updateEntrepreneurPitchDeck(activeDeckId, payload);
        await loadDecks(activeDeckId);

        if (!options?.silent) {
          toast.success("Pitch deck salvo.");
        }

        return activeDeckId;
      }

      const response = await createEntrepreneurPitchDeck(payload);
      const nextId = response.data.id;
      await loadDecks(nextId);

      if (!options?.silent) {
        toast.success("Pitch deck criado.");
      }

      return nextId;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveDraft();
  };

  const handleGenerate = async () => {
    const deckId = await saveDraft({ silent: true });

    if (!deckId) return;

    setGenerating(true);

    try {
      const response = await generateEntrepreneurPitchDeck(deckId, prompt);
      setGeneratedText(response.data.text);
      await loadDecks(deckId);
      toast.success("Texto gerado para revisão.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGeneratedText = async () => {
    if (!activeDeckId) {
      toast.error("Salve o rascunho antes de editar o texto gerado.");
      return;
    }

    setSavingText(true);

    try {
      await updateEntrepreneurPitchDeck(activeDeckId, {
        generated_content: generatedText.trim() || null,
      });
      await loadDecks(activeDeckId);
      toast.success("Texto revisado salvo.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingText(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!activeDeckId) {
      toast.error("Salve o rascunho antes de gerar PDF.");
      return;
    }

    if (!generatedText.trim()) {
      toast.error("Gere ou escreva o texto do pitch deck antes de criar o PDF.");
      return;
    }

    setGeneratingPdf(true);

    try {
      await updateEntrepreneurPitchDeck(activeDeckId, {
        generated_content: generatedText.trim(),
      });
      await generateEntrepreneurPitchDeckPdf(activeDeckId);
      await loadDecks(activeDeckId);
      toast.success("PDF gerado.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const openLink = (url: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground">
            <Link to="/app/ferramentas">
              <ArrowLeft className="h-4 w-4" />
              Ferramentas
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pitch Deck</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Preencha os blocos de conteúdo, salve o rascunho e use a geração do backend quando
              quiser produzir uma primeira versão revisável.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={startNewDraft} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo pitch deck
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pitch Deck indisponível</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <Card className="border-border/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">Rascunhos</h2>
              <Badge variant="outline">{decks.length}</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A listagem usa `/entrepreneurs/pitch-decks`. Downloads aparecem apenas quando o
              backend retorna links.
            </p>
          </Card>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Nenhum pitch deck salvo ainda.
            </Card>
          ) : (
            <div className="space-y-2">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => setActiveDeckId(deck.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeDeckId === deck.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium">
                      Pitch deck #{deck.id}
                    </span>
                  </div>
                  <div className="mt-1 text-xs">Atualizado em {formatDate(deck.updated_at)}</div>
                  {deck.generated_content && (
                    <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/10">
                      Com texto gerado
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="space-y-6">
          <Card className="border-border/60 p-5">
            <form className="space-y-5" onSubmit={handleSaveDraft}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Informações-base</h2>
                  <p className="text-sm text-muted-foreground">
                    {completedFields} de {pitchFields.length} blocos preenchidos.
                  </p>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar rascunho
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {pitchFields.map((field) => (
                  <div
                    key={field.key}
                    className={cn("space-y-2", field.key === "description" && "md:col-span-2")}
                  >
                    <Label htmlFor={`pitch-${field.key}`}>{field.label}</Label>
                    <Textarea
                      id={`pitch-${field.key}`}
                      value={form[field.key]}
                      rows={field.rows ?? 4}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </form>
          </Card>

          <Card className="border-border/60 p-5">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gerador de texto</h2>
                  <p className="text-sm text-muted-foreground">
                    A geração chama `POST /entrepreneurs/pitch-decks/:id/generate` e salva o texto
                    para revisão.
                  </p>
                </div>
                <Button onClick={handleGenerate} disabled={saving || generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Salvar e gerar
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pitch-prompt">Instruções adicionais</Label>
                <Input
                  id="pitch-prompt"
                  value={prompt}
                  maxLength={2000}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ex.: enfatize crescimento B2B e uso dos recursos."
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. O backend limita este campo a 2.000 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pitch-generated">Texto gerado/editável</Label>
                <Textarea
                  id="pitch-generated"
                  value={generatedText}
                  rows={12}
                  onChange={(event) => setGeneratedText(event.target.value)}
                  placeholder="O texto gerado pelo backend aparecerá aqui para revisão."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveGeneratedText}
                  disabled={!activeDeckId || savingText}
                >
                  {savingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar texto editado
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePdf}
                  disabled={!activeDeckId || !generatedText.trim() || generatingPdf}
                >
                  {generatingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Gerar PDF
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!activeDeck?.download_link}
                  onClick={() => openLink(activeDeck?.download_link ?? null)}
                >
                  <Download className="h-4 w-4" />
                  Baixar TXT
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!activeDeck?.pdf_download_link}
                  onClick={() => openLink(activeDeck?.pdf_download_link ?? null)}
                >
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>

              {!activeDeckId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Rascunho ainda não salvo</AlertTitle>
                  <AlertDescription>
                    Salve o pitch deck antes de gerar texto, editar conteúdo gerado ou solicitar PDF.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
