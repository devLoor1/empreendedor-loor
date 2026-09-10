import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { appLogoUrl, appLogoAlt } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { changePassword } from "@/services/api";
import {
  getPasswordPolicyError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_COPY,
} from "@/features/auth/password-policy";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [form, setForm] = useState({ password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password || !form.password_confirmation)
      return toast.error("Preencha os dois campos");
    if (form.password !== form.password_confirmation) return toast.error("As senhas não coincidem");
    const passwordPolicyError = getPasswordPolicyError(form.password);
    if (passwordPolicyError) return toast.error(passwordPolicyError);
    if (!token) return toast.error("Token inválido");
    setLoading(true);
    try {
      await changePassword(token, form.password, form.password_confirmation);
      toast.success("Senha alterada com sucesso! Faça login.");
      navigate("/auth");
    } catch (err: unknown) {
      const apiError = err as { errors?: Array<{ message?: string }>; message?: string };
      const msg =
        apiError?.errors?.[0]?.message ||
        apiError?.message ||
        "Link inválido ou expirado. Solicite um novo.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 shadow-[var(--shadow-soft)] border-border/60">
        <div className="flex items-center gap-2 mb-6">
          <img src={appLogoUrl} alt={appLogoAlt} className="h-8 w-auto" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">Nova senha</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Digite e confirme sua nova senha.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-pwd">Nova senha</Label>
            <Input
              id="new-pwd"
              type="password"
              placeholder="8 a 60 caracteres"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
              aria-describedby="new-pwd-help"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p id="new-pwd-help" className="text-xs text-muted-foreground">
              {PASSWORD_REQUIREMENTS_COPY}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pwd">Confirmar senha</Label>
            <Input
              id="confirm-pwd"
              type="password"
              placeholder="Repita a senha"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Voltar ao login
          </Button>
        </form>
      </Card>
    </div>
  );
}
