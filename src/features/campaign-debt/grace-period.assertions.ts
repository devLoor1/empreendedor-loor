import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatGracePeriod, parseGracePeriod, readGracePeriod } from "./grace-period.ts";

assert.deepEqual(parseGracePeriod("0", "4", "14"), { years: 0, months: 4, days: 14 });
assert.deepEqual(parseGracePeriod("2", "0", "0"), { years: 2, months: 0, days: 0 });
assert.deepEqual(parseGracePeriod("0", "0", "23"), { years: 0, months: 0, days: 23 });
for (const parts of [["0", "0", "0"], ["-1", "1", "0"], ["a", "0", "1"], ["1.5", "0", "0"]]) {
  assert.equal(parseGracePeriod(...parts as [string, string, string]), null);
}
assert.deepEqual(readGracePeriod(null, 4), { years: 0, months: 4, days: 0 });
assert.equal(formatGracePeriod({ years: 0, months: 0, days: 23 }), "0 ano(s), 0 mês(es), 23 dia(s)");

const create = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
const debt = readFileSync(new URL("../../pages/campanha-divida.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../../pages/campanha-detalhe.tsx", import.meta.url), "utf8");
assert.match(create, /grace_period_detail: gracePeriod/);
assert.doesNotMatch(create, /grace_period: 0/);
assert.match(debt, /debt\.opportunity\.status === "review"/);
assert.match(debt, /updateDebtSchedule\(Number\(id\), \{ grace_period_detail: next \}\)/);
assert.match(detail, /Documentos Opcionais da Oportunidade/);
assert.match(detail, /Anexos complementares não bloqueiam criação, revisão, aprovação ou publicação/);
assert.doesNotMatch(create, /opportunityDocuments\.length\s*[!=<>]=?\s*0/);
assert.match(detail, /label="Prazo previsto" value=\{formatOpportunityDate\(opp\.due_at\)\}/);
assert.match(detail, /label="Encerrada em" value=\{formatOpportunityDate\(opp\.end_at\)\}/);
console.log("Entrepreneur grace/document/date assertions passed");
