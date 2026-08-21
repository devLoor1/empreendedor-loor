import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, MessageSquare, Reply, Pencil, Trash2, UserRound, MoreHorizontal, X, Loader2,
} from "lucide-react";
import {
  getEntrepreneurForums,
  getEntrepreneurForumComments,
  createEntrepreneurForumComment,
  updateEntrepreneurForumComment,
  deleteEntrepreneurForumComment,
  getEntrepreneurForumCommentReplies,
  getEntrepreneurInvestorSummary,
  type ForumComment,
  type ForumListItem,
  type InvestorSummary,
} from "@/services/api";
import { toast } from "sonner";

export function ForumPage() {
  const [forums, setForums] = useState<ForumListItem[]>([]);
  const [selectedForum, setSelectedForum] = useState<ForumListItem | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<ForumComment | null>(null);
  const [editingComment, setEditingComment] = useState<ForumComment | null>(null);
  const [newComment, setNewComment] = useState("");
  const [investorDialog, setInvestorDialog] = useState<{ investor: ForumComment; summary: InvestorSummary | null } | null>(null);

  const fetchForums = () => {
    setLoading(true);
    setError(null);
    getEntrepreneurForums()
      .then(data => setForums(data))
      .catch(err => setError(err instanceof Error ? err.message : "Erro ao carregar fóruns"))
      .finally(() => setLoading(false));
  };

  const fetchComments = () => {
    if (!selectedForum) return;
    setLoading(true);
    setError(null);
    getEntrepreneurForumComments(selectedForum.id.toString())
      .then(data => setComments(data))
      .catch(err => setError(err instanceof Error ? err.message : "Erro ao carregar comentários"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchForums();
  }, []);

  useEffect(() => {
    if (selectedForum) {
      fetchComments();
    }
  }, [selectedForum]);

  const handleCreateComment = async () => {
    if (!selectedForum || !newComment.trim()) return;
    setActionLoading(true);
    try {
      await createEntrepreneurForumComment(selectedForum.id.toString(), newComment.trim(), replyTo?.id);
      setNewComment("");
      setReplyTo(null);
      fetchComments();
      toast.success("Comentário criado com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar comentário");
      toast.error("Erro ao criar comentário");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !newComment.trim()) return;
    setActionLoading(true);
    try {
      await updateEntrepreneurForumComment(editingComment.id, newComment.trim());
      setNewComment("");
      setEditingComment(null);
      fetchComments();
      toast.success("Comentário atualizado com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar comentário");
      toast.error("Erro ao atualizar comentário");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComment = async (comment: ForumComment) => {
    setActionLoading(true);
    try {
      await deleteEntrepreneurForumComment(comment.id);
      fetchComments();
      toast.success("Comentário deletado com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar comentário");
      toast.error("Erro ao deletar comentário");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowInvestor = async (comment: ForumComment) => {
    if (comment.author_type !== "INVESTOR") return;
    setInvestorDialog({ investor: comment, summary: null });
    try {
      const summary = await getEntrepreneurInvestorSummary(comment.author_id);
      setInvestorDialog(prev => prev ? { ...prev, summary } : null);
    } catch (err) {
      toast.error("Erro ao carregar dados do investidor");
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: ForumComment; depth?: number }) => {
    const isInvestor = comment.author_type === "INVESTOR";
    const authorDisplay = isInvestor ? comment.author_alias : comment.author_name || comment.author_type;
    const isMyComment = comment.author_type === "VENTURE";

    return (
      <div className={`border-l-2 ${depth > 0 ? "border-muted ml-4 pl-4" : "border-primary ml-0 pl-0"}`}>
        <Card className="p-4 mb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={comment.author_type === "ADMIN" ? "default" : comment.author_type === "VENTURE" ? "secondary" : "outline"}>
                  {comment.author_type}
                </Badge>
                <span className="font-medium">{authorDisplay}</span>
                {comment.is_edited && <span className="text-xs text-muted-foreground">(editado)</span>}
                {comment.is_hidden && <Badge variant="destructive" className="ml-2">Oculto</Badge>}
                {comment.is_deleted && <Badge variant="destructive" className="ml-2">Deletado</Badge>}
              </div>
              <p className="text-sm mb-2">{comment.content}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{new Date(comment.created_at).toLocaleString("pt-BR")}</span>
                {isInvestor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowInvestor(comment)}
                    className="h-6 px-2"
                  >
                    <UserRound className="w-3 h-3 mr-1" />
                    Ver perfil
                  </Button>
                )}
              </div>
            </div>
            {isMyComment && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditingComment(comment); setNewComment(comment.content); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setReplyTo(comment)}>
                  <Reply className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-2">
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      {!selectedForum ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Fórum</h1>
          </div>
          <Card className="p-6">
            {loading && <p className="text-sm text-muted-foreground mb-4">Carregando...</p>}
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            
            {!loading && !error && forums.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum fórum disponível.</p>
            )}

            {!loading && !error && forums.length > 0 && (
              <div className="space-y-4">
                {forums.map(forum => (
                  <Card key={forum.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{forum.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {forum.totalComments} comentários • {forum.unansweredComments} não respondidos
                        </p>
                      </div>
                      <Button onClick={() => setSelectedForum(forum)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Ver fórum
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedForum(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{selectedForum.name}</h2>
            
            {replyTo && (
              <Alert className="mb-4">
                <Reply className="h-4 w-4" />
                <AlertDescription>
                  Respondendo a: <span className="font-medium">{replyTo.author_alias || replyTo.author_name}</span>
                  <Button variant="ghost" size="sm" className="ml-2" onClick={() => setReplyTo(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {editingComment && (
              <Alert className="mb-4">
                <Pencil className="h-4 w-4" />
                <AlertDescription>
                  Editando comentário
                  <Button variant="ghost" size="sm" className="ml-2" onClick={() => { setEditingComment(null); setNewComment(""); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 mb-6">
              <Textarea
                placeholder={editingComment ? "Edite seu comentário..." : "Escreva seu comentário..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <Button 
                onClick={editingComment ? handleUpdateComment : handleCreateComment}
                disabled={actionLoading || !newComment.trim()}
                className="self-end"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              {newComment.length}/200 caracteres
            </div>

            {loading && <p className="text-sm text-muted-foreground">Carregando comentários...</p>}
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            
            {!loading && !error && comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum comentário ainda. Seja o primeiro!</p>
            )}

            {!loading && !error && comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </Card>
        </div>
      )}

      <Dialog open={!!investorDialog} onOpenChange={() => setInvestorDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil do Investidor</DialogTitle>
          </DialogHeader>
          {investorDialog && (
            <div className="space-y-4">
              {investorDialog.summary ? (
                <>
                  <div>
                    <Label>Nome</Label>
                    <p className="text-sm">{investorDialog.summary.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{investorDialog.summary.email}</p>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <p className="text-sm">{investorDialog.summary.phone}</p>
                  </div>
                  <div>
                    <Label>Quantidade de Investimentos</Label>
                    <p className="text-sm">{investorDialog.summary.investmentsCount}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
