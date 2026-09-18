import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CREATION_PIX_TYPES,
  requireCreationPixType,
  requireProfitabilityBasis,
  profitabilityBasisLabel,
} from "./opportunity-presentation-alignment.ts";
import { extractOpportunityProfilePrefill } from "./opportunity-profile-prefill.ts";
let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count++;
};
check(
  CREATION_PIX_TYPES.length === 4 &&
    !CREATION_PIX_TYPES.some((item) => String(item.value) === "cnpj"),
  "CNPJ absent",
);
assert.throws(() => requireCreationPixType("cnpj"));
count++;
assert.throws(() => requireCreationPixType(""));
count++;
for (const type of CREATION_PIX_TYPES)
  check(requireCreationPixType(type.value) === type.value, "valid Pix accepted");
check(requireProfitabilityBasis("annual") === "annual", "annual enum");
check(requireProfitabilityBasis("monthly") === "monthly", "monthly enum");
assert.throws(() => requireProfitabilityBasis(""));
count++;
assert.throws(() => requireProfitabilityBasis("mensal"));
count++;
check(profitabilityBasisLabel(null) === "Não informada pela API", "missing readback not defaulted");
check(
  profitabilityBasisLabel("annual") === "Anual" && profitabilityBasisLabel("monthly") === "Mensal",
  "labels",
);
const prefill = extractOpportunityProfilePrefill(
  null,
  null,
  { data: { pix: { type: "cnpj", key: "73925184000174" } } },
  [],
);
check(!prefill.values.pixType && !prefill.values.pixKey, "historical CNPJ never becomes new write");
const source = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
const pixValidation = source.slice(source.indexOf("function isValidPix("), source.indexOf("function getOptionName("));
check(
  source.includes("const PIX_TYPES = CREATION_PIX_TYPES") &&
    !pixValidation.includes('if (type === "cnpj")'),
  "selector and validation aligned",
);
check(
  source.includes("type: requireCreationPixType(draft.pixType)"),
  "stale state serialization blocked",
);
check(
  source.includes("profitability_basis: requireProfitabilityBasis(draft.profitabilityBasis)"),
  "debt serialization",
);
check(
  source.includes('draft.modality === "debt"') && source.includes("equity: {"),
  "modality branches retained",
);
check(
  source.includes("summary?.data?.profitability_basis !== draft.profitabilityBasis"),
  "summary readback check",
);
check(
  source.includes("mergeOpportunityProfilePrefill(current, values, touchedDraftFieldsRef.current)"),
  "override regression retained",
);
check(source.includes("grace_period: 0"), "grace policy not changed");
console.log(`opportunity-presentation-alignment: ${count} assertions passed`);
