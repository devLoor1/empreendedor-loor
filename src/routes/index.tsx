import { createFileRoute, redirect } from "@tanstack/react-router";
import { mockStore } from "@/lib/mock-store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = mockStore.getUser();
    throw redirect({ to: user ? "/app/dashboard" : "/auth" });
  },
  component: () => null,
});
