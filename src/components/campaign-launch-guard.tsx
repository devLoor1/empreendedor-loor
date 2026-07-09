import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getBlockingPrerequisites,
  useCampaignReadiness,
  type CampaignPrerequisite,
  type CampaignPrerequisiteStatus,
} from "@/hooks/use-campaign-readiness";

export function CampaignCreateButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const readiness = useCampaignReadiness();
  const blocking = useMemo(() => getBlockingPrerequisites(readiness.items), [readiness.items]);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!readiness.loading && blocking.length === 0) {
      navigate("/app/campanhas/nova");
      return;
    }

    setOpen(true);
  };

  return (
    <>
      <Button onClick={handleClick} className={cn("gap-2", className)} disabled={readiness.loading}>
        {readiness.loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Criar campanha
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-requisitos da campanha</DialogTitle>
            <DialogDescription>
              Revise os pontos abaixo antes de iniciar uma nova oportunidade.
            </DialogDescription>
          </DialogHeader>
          <CampaignPrerequisiteList items={readiness.items} loading={readiness.loading} compact />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CampaignPrerequisiteList({
  items,
  loading,
  compact = false,
}: {
  items: CampaignPrerequisite[];
  loading: boolean;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <Card className="border-border/60 p-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Validando dados do perfil...
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-2")}>
      {items.map((item) => (
        <CampaignPrerequisiteItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function CampaignPrerequisiteItem({ item }: { item: CampaignPrerequisite }) {
  const Icon = item.icon;
  const complete = item.status === "complete";
  const blocked = item.status === "blocked";

  return (
    <Card
      className={cn("border-border/60 p-4", blocked && "border-destructive/40 bg-destructive/5")}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            complete
              ? "bg-primary/10 text-primary"
              : blocked
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground",
          )}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            <PrerequisiteBadge status={item.status} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          <Button asChild variant="outline" size="sm">
            <Link to={item.href}>
              {item.action}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PrerequisiteBadge({ status }: { status: CampaignPrerequisiteStatus }) {
  if (status === "complete") {
    return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">OK</Badge>;
  }

  if (status === "blocked") {
    return <Badge variant="destructive">Bloqueado</Badge>;
  }

  if (status === "attention") {
    return <Badge variant="secondary">Atenção</Badge>;
  }

  return <Badge variant="outline">Pendente</Badge>;
}

export function CampaignCreationStatusCard() {
  return (
    <Card className="border-border/60 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold text-foreground">Criação segura</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A campanha só é persistida no botão final do wizard. Não há autosave, Pix, QR Code ou
            pagamento nesta etapa.
          </p>
        </div>
      </div>
    </Card>
  );
}
