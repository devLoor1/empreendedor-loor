import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildOwnerContentPatch,
  canEditOwnerContent,
  ownerContentReadbackMatches,
  toOwnerContentDraft,
  type OwnerContent,
} from "./owner-content-edit.ts";

const original: OwnerContent = {
  id: 41,
  status: "review",
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
  about: "Sobre",
  description: "Descrição atualizada",
  promotional_video_url: original.promotional_video_url ?? "",
}), { description: "Descrição atualizada" });

const patch = buildOwnerContentPatch(original, {
  about: " Sobre atualizado ",
  description: "Descrição",
  promotional_video_url: "  ",
});
assert.deepEqual(patch, { about: "Sobre atualizado", promotional_video_url: null });
assert.deepEqual(buildOwnerContentPatch({ ...original, status: "finished" }, {
  about: "Outro",
  description: "Outra",
  promotional_video_url: "",
}), {});
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
assert.match(detailSource, /setPendingPatch\(patch\)/);
assert.match(detailSource, /Tentar confirmar leitura/);
assert.doesNotMatch(detailSource, /company_cnpj:.*patch|patch\.company_cnpj/);

console.log("Owner content edit assertions passed.");
