import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getOpportunityCreationModalities,
  isOpportunityCreationModalityAllowed,
  requireOpportunityCreationModality,
} from "./opportunity-modality-policy.ts";

assert.deepEqual(getOpportunityCreationModalities("finapop"), ["debt"]);
assert.deepEqual(getOpportunityCreationModalities("finapop-homologacao"), ["debt"]);
assert.deepEqual(getOpportunityCreationModalities("loor"), ["debt", "equity"]);
assert.equal(isOpportunityCreationModalityAllowed("debt", "finapop"), true);
assert.equal(isOpportunityCreationModalityAllowed("equity", "finapop"), false);
assert.equal(isOpportunityCreationModalityAllowed("equity", "loor"), true);
assert.equal(requireOpportunityCreationModality("debt", "finapop"), "debt");
assert.throws(() => requireOpportunityCreationModality("equity", "finapop"));

const createSource = readFileSync(
  new URL("../../pages/campanha-nova.tsx", import.meta.url),
  "utf8",
);
const detailSource = readFileSync(
  new URL("../../pages/campanha-detalhe.tsx", import.meta.url),
  "utf8",
);
assert.ok(
  createSource.includes("getOpportunityCreationModalities(") &&
    createSource.includes("requireOpportunityCreationModality(") &&
    createSource.includes("ENTREPRENEUR_PLATFORM_SLUG"),
  "Finapop modality policy guards both the selector and serialization",
);
assert.ok(
  detailSource.includes('opp.modality === "equity" ? "Equity" : "Dívida"') &&
    detailSource.includes("opp.equity &&"),
  "historical Equity read presentation remains supported",
);

console.log("opportunity-modality-policy: 10 assertions passed");
