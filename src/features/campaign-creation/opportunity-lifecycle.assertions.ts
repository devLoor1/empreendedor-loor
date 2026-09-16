import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { formatOpportunityDate, parseOpportunityDate } from "./opportunity-lifecycle.ts";

let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

for (const absent of [null, undefined, "", "null", "NULL", "invalid"]) {
  check(parseOpportunityDate(absent) === null, `${String(absent)} não vira uma data inventada`);
  check(formatOpportunityDate(absent) === "—", `${String(absent)} apresenta fallback honesto`);
}
check(
  formatOpportunityDate("2026-09-16T12:00:00.000Z") === "16/09/2026",
  "data real é exibida em pt-BR",
);

const detail = readFileSync(new URL("../../pages/campanha-detalhe.tsx", import.meta.url), "utf8");
const list = readFileSync(new URL("../../pages/campanhas.tsx", import.meta.url), "utf8");
check(
  detail.includes('label="Criada em" value={formatOpportunityDate(opp.created_at)}'),
  "created_at não é abertura",
);
check(
  detail.includes('label="Prazo previsto" value={formatOpportunityDate(opp.due_at)}'),
  "due_at não é fechamento realizado",
);
check(
  detail.includes('label="Encerrada em" value={formatOpportunityDate(opp.end_at)}'),
  "end_at é encerramento realizado",
);
check(
  detail.includes('label="Carência cadastrada"'),
  "carência é mostrada sem assumir marco inicial",
);
check(detail.includes("Endereço da oportunidade"), "endereço próprio tem readback no detalhe");
check(
  list.includes("Prazo previsto: {formatOpportunityDate(c.due_at)}"),
  "lista ativa usa prazo previsto",
);
check(
  list.includes("Encerrada em {formatOpportunityDate(c.end_at)}"),
  "lista finalizada usa end_at",
);

console.log(`opportunity-lifecycle: ${count} assertions passed`);
