import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ENTREPRENEUR_TOOL_KEYS,
  getEntrepreneurTools,
  type EntrepreneurTool,
  type EntrepreneurToolKey,
} from "@/services/api";

export type EntrepreneurToolAccessState =
  | "loading"
  | "enabled"
  | "disabled"
  | "unavailable";

export const TOOL_DISABLED_MESSAGE = "Ferramenta desabilitada pelo administrador.";

const knownToolKeys = new Set<string>(ENTREPRENEUR_TOOL_KEYS);

export function isToolDisabledApiError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status?: unknown }).status === 403,
  );
}

export function useEntrepreneurTools() {
  const query = useQuery({
    queryKey: ["entrepreneur-tools"],
    queryFn: getEntrepreneurTools,
    retry: 1,
    staleTime: 30_000,
  });

  const tools = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const toolsByKey = useMemo(
    () => new Map(tools.map((tool) => [tool.key, tool] as const)),
    [tools],
  );
  const unknownTools = useMemo(
    () => tools.filter((tool) => !knownToolKeys.has(tool.key)),
    [tools],
  );
  const isEmpty = query.isSuccess && tools.length === 0;
  const refetch = query.refetch;

  const getTool = useCallback(
    (key: EntrepreneurToolKey): EntrepreneurTool | undefined => toolsByKey.get(key),
    [toolsByKey],
  );

  const getAccessState = useCallback(
    (key: EntrepreneurToolKey): EntrepreneurToolAccessState => {
      if (query.isPending) return "loading";
      if (query.isError || isEmpty) return "unavailable";

      const tool = toolsByKey.get(key);
      if (!tool) return "unavailable";

      return tool.enabled ? "enabled" : "disabled";
    },
    [isEmpty, query.isError, query.isPending, toolsByKey],
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    tools,
    unknownTools,
    isEmpty,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
    getTool,
    getAccessState,
    refresh,
  };
}
