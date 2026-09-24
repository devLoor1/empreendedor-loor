import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ENTREPRENEUR_NEW_WRITE_PIX_TYPES,
  isEntrepreneurNewWritePixType,
  requireEntrepreneurNewWritePixType,
} from "../banking/entrepreneur-pix-policy.ts";
import {
  formatProfitabilityWithBasis,
  requireProfitabilityBasis,
  profitabilityBasisLabel,
} from "./opportunity-presentation-alignment.ts";
import { normalizePixKeyByType } from "../../utils/br-formatters.ts";
let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count++;
};
assert.deepEqual(
  ENTREPRENEUR_NEW_WRITE_PIX_TYPES.map((item) => item.value),
  ["phone", "email", "random"],
);
count++;
check(!isEntrepreneurNewWritePixType("cpf"), "CPF absent for Entrepreneur new writes");
check(!isEntrepreneurNewWritePixType("cnpj"), "CNPJ remains absent for Entrepreneur new writes");
assert.throws(() => requireEntrepreneurNewWritePixType("cpf"));
count++;
assert.throws(() => requireEntrepreneurNewWritePixType("cnpj"));
count++;
assert.throws(() => requireEntrepreneurNewWritePixType(""));
count++;
for (const type of ENTREPRENEUR_NEW_WRITE_PIX_TYPES)
  check(
    requireEntrepreneurNewWritePixType(type.value) === type.value,
    "valid Entrepreneur Pix accepted",
  );
check(
  normalizePixKeyByType("cpf", "123.456.789-09") === "12345678909",
  "global CPF normalization remains available to supported non-Entrepreneur contexts",
);
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
check(formatProfitabilityWithBasis("1.00", "monthly") === "1.00% a.m.", "monthly uses a.m. without changing rate");
check(formatProfitabilityWithBasis("1.00", "annual") === "1.00% a.a.", "annual uses a.a. without changing rate");
check(
  formatProfitabilityWithBasis("1.00", null) === "1.00% · base não informada pela API",
  "missing basis is not assumed annual",
);
const source = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
const detailSource = readFileSync(new URL("../../pages/campanha-detalhe.tsx", import.meta.url), "utf8");
const debtSource = readFileSync(new URL("../../pages/campanha-divida.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("../../services/api.ts", import.meta.url), "utf8");
const pixValidation = source.slice(
  source.indexOf("function isValidPix("),
  source.indexOf("function getOptionName("),
);
check(
  source.includes("const PIX_TYPES = ENTREPRENEUR_NEW_WRITE_PIX_TYPES") &&
    pixValidation.includes("if (!isEntrepreneurNewWritePixType(type)) return false") &&
    !pixValidation.includes('type === "cpf"') &&
    !pixValidation.includes('type === "cnpj"'),
  "Entrepreneur selector and validation share the role-scoped policy",
);
check(
  source.includes('pixType: "phone"') && !source.includes('pixType: "cpf"'),
  "new Opportunity draft never defaults to CPF",
);
check(
  source.includes("type: requireEntrepreneurNewWritePixType(draft.pixType)"),
  "stale or manipulated CPF state is blocked at serialization",
);
check(
  apiSource.includes("requireEntrepreneurNewWritePixType(data.pix.type)"),
  "Entrepreneur profile banking POST uses the same serialization guard",
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
check(source.includes("grace_period_detail: gracePeriod"), "grace uses Product years/months/days contract");
check(
  detailSource.includes("getDebtSummary(Number(id))") &&
    detailSource.includes("formatProfitabilityWithBasis(opp.debt.percentage_profitability, profitabilityBasis)") &&
    debtSource.includes("formatProfitabilityWithBasis(debt.percentageProfitability, summary?.profitability_basis)"),
  "both Entrepreneur detail surfaces use the authoritative summary basis",
);
console.log(`opportunity-presentation-alignment: ${count} assertions passed`);
