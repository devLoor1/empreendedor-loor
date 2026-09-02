import { resolvePwaBrandConfig, type PwaEnvironment } from "./pwaConfig";

export const runtimePwaConfig = resolvePwaBrandConfig(
  import.meta.env as unknown as PwaEnvironment,
  "entrepreneur",
);
