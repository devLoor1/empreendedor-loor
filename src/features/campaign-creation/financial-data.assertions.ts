import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildOpportunityMonetaryPayload } from "./opportunity-creation.ts";
import {
  formatBRLFromCents,
  parseBrazilianMoneyToCents,
  parseLocaleDecimalNumber,
} from "../../utils/br-formatters.ts";

const moneyCases = [
  ["R$ 1", 100, "R$ 1,00"],
  ["R$ 1,00", 100, "R$ 1,00"],
  ["R$ 10", 1_000, "R$ 10,00"],
  ["R$ 10,00", 1_000, "R$ 10,00"],
  ["100", 10_000, "R$ 100,00"],
  ["R$ 100", 10_000, "R$ 100,00"],
  ["R$ 100,00", 10_000, "R$ 100,00"],
  ["R$ 100,50", 10_050, "R$ 100,50"],
  ["R$ 1.000", 100_000, "R$ 1.000,00"],
  ["R$ 1.000,00", 100_000, "R$ 1.000,00"],
] as const;

const normalizeSpaces = (value: string) => value.replace(/\s/g, " ");
let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

for (const [input, expectedCents, expectedDisplay] of moneyCases) {
  const requestValue = parseBrazilianMoneyToCents(input);

  check(requestValue === expectedCents, `${input} é serializado em centavos uma vez`);
  check(
    normalizeSpaces(formatBRLFromCents(requestValue)) === expectedDisplay,
    `${input} retorna dos centavos para a mesma exibição em BRL`,
  );
}

assert.deepEqual(
  buildOpportunityMonetaryPayload("R$ 100,00", "R$ 1.000", "R$ 10"),
  {
    max_goal: 10_000,
    min_investment_value: 100_000,
    warranty_amount: 1_000,
  },
  "payload monetário envia somente centavos inteiros",
);
count += 1;

check(
  buildOpportunityMonetaryPayload("100", "10").warranty_amount === 0,
  "payload mantém a garantia ausente em zero centavos",
);
check(
  normalizeSpaces(formatBRLFromCents(10_000)) === "R$ 100,00",
  "readback independente de 10000 centavos apresenta R$ 100,00",
);

for (const [input, expected] of [
  ["0,5", 0.5],
  ["0.5", 0.5],
  ["1,25", 1.25],
  ["1.25", 1.25],
] as const) {
  check(parseLocaleDecimalNumber(input) === expected, `${input} preserva o decimal informado`);
}

for (const malformed of ["1,2.5", "1.2.5", "1,25,0", "1.25.0"]) {
  check(parseLocaleDecimalNumber(malformed) === 0, `${malformed} nao e aceito ambiguamente`);
}

const consumerFiles = [
  "../../pages/dashboard.tsx",
  "../../pages/campanhas.tsx",
  "../../pages/campanha-detalhe.tsx",
  "../../pages/campanha-divida.tsx",
];

for (const path of consumerFiles) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");

  check(source.includes("formatBRLFromCents("), `${path} converte centavos apenas na exibição`);
}

const creationSource = readFileSync(
  new URL("../../pages/campanha-nova.tsx", import.meta.url),
  "utf8",
);
check(
  creationSource.includes("monetary: buildOpportunityMonetaryPayload("),
  "criação usa a serialização monetária centralizada",
);
check(
  creationSource.includes("percentage_profitability: toPositiveDecimal("),
  "rentabilidade usa parser decimal sem alterar o campo monetário",
);

console.log(`financial-data: ${count} assertions passed`);
