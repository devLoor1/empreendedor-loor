import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildOwnerContentPatch,
  canEditOwnerContent,
  ownerContentReadbackMatches,
  ownerContentSourceMatches,
  toOwnerContentDraft,
  validateOwnerIdentityPatch,
  type OwnerContent,
} from "./owner-content-edit.ts";

const original: OwnerContent = {
  id: 41,
  status: "review",
  name: "Oportunidade QA",
  business_name: "Empresa QA",
  about: "Sobre",
  description: "Descrição",
  promotional_video_url: "https://www.youtube.com/watch?v=abc",
};

assert.equal(canEditOwnerContent("review"), true);
assert.equal(canEditOwnerContent("active"), true);
assert.equal(canEditOwnerContent("finished"), false);
assert.equal(canEditOwnerContent("archived"), false);
assert.equal(canEditOwnerContent("unknown"), false);
assert.deepEqual(buildOwnerContentPatch(original, toOwnerContentDraft(original)), {});
assert.deepEqual(buildOwnerContentPatch({ ...original, status: "active" }, {
  name: "Oportunidade ativa atualizada",
  business_name: "Empresa ativa atualizada",
  about: "Sobre",
  description: "Descrição atualizada",
  promotional_video_url: original.promotional_video_url ?? "",
}), {
  name: "Oportunidade ativa atualizada",
  business_name: "Empresa ativa atualizada",
  description: "Descrição atualizada",
});

const patch = buildOwnerContentPatch(original, {
  name: " Oportunidade QA ",
  business_name: " Empresa QA ",
  about: " Sobre atualizado ",
  description: "Descrição",
  promotional_video_url: "  ",
});
assert.deepEqual(patch, { about: "Sobre atualizado", promotional_video_url: null });
assert.deepEqual(buildOwnerContentPatch({ ...original, status: "finished" }, {
  name: "Outro nome",
  business_name: "Outra empresa",
  about: "Outro",
  description: "Outra",
  promotional_video_url: "",
}), {});
assert.equal(ownerContentSourceMatches(original, { ...original }), true);
assert.equal(ownerContentSourceMatches(original, { ...original, name: "Alterada" }), false);
assert.equal(ownerContentSourceMatches(original, { ...original, business_name: "Alterada" }), false);
assert.equal(ownerContentSourceMatches(original, { ...original, status: "active" }), false);
assert.equal(ownerContentSourceMatches(original, null), false);
assert.equal(validateOwnerIdentityPatch({ name: "" }), "Nome da oportunidade e nome empresarial não podem ficar vazios.");
assert.equal(validateOwnerIdentityPatch({ business_name: "" }), "Nome da oportunidade e nome empresarial não podem ficar vazios.");
assert.equal(validateOwnerIdentityPatch({ name: "a".repeat(256) }), "Nome da oportunidade e nome empresarial devem ter no máximo 255 caracteres.");
assert.equal(validateOwnerIdentityPatch({ name: "Nome", business_name: "Empresa" }), null);
assert.equal(ownerContentReadbackMatches(original, patch, { ...original, ...patch }), true);
assert.equal(ownerContentReadbackMatches(original, patch, { ...original, about: "Ainda antigo" }), false);
assert.equal(ownerContentReadbackMatches(original, patch, { ...original, id: 42, ...patch }), false);
assert.equal(ownerContentReadbackMatches(original, patch, null), false);

const detailSource = readFileSync(new URL("../../pages/campanha-detalhe.tsx", import.meta.url), "utf8");
assert.match(detailSource, /await updateOpportunity\(opportunity.id, patch\)/);
assert.match(detailSource, /await getOpportunity\(opportunity.id\)/);
assert.match(detailSource, /ownerContentReadbackMatches/);
assert.match(detailSource, /const before = await getOpportunity\(opportunity.id\)/);
assert.match(detailSource, /!canEditOwnerContent\(current.status\)/);
assert.match(detailSource, /ownerContentSourceMatches\(opportunity, current\)/);
assert.match(detailSource, /setPendingPatch\(patch\)/);
assert.match(detailSource, /Tentar confirmar leitura/);
assert.match(detailSource, /Nome da oportunidade/);
assert.match(detailSource, /Nome empresarial exibido/);
assert.doesNotMatch(detailSource, /company_cnpj:.*patch|patch\.company_cnpj/);
assert.doesNotMatch(detailSource, /patch\.(monetary|address|bank_account|pix|debt)/);

console.log("Owner content and identity edit assertions passed.");
