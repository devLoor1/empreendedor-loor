import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { mockStore } from "@/lib/mock-store";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!mockStore.getUser()) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});