import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  filterSearchableOptions,
  getCountryValueForNewDraft,
  getCountryValueForReset,
  getSelectedSearchableOption,
  isBrazilCountry,
  normalizeSubdivisionForPayload,
  toNumericPayloadId,
  type CountryReference,
  type SearchableOption,
} from "./opportunity-creation";

const countries: CountryReference[] = [
  { id: 44, name: "Argentina", abbreviation: "AR" },
  { id: 77, name: "Brasil", abbreviation: "BR" },
  { id: 101, name: "United States", abbreviation: "USA" },
];
const banks: SearchableOption[] = [
  { value: "24", label: "Banco do Brasil", keywords: "BB" },
  { value: "42", label: "Nubank", keywords: "Nu Pagamentos" },
];
const pageSource = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

check(isBrazilCountry({ name: "Brazil", abbreviation: "" }), "resolve Brazil pelo nome em inglês");
check(isBrazilCountry({ name: "Qualquer", abbreviation: "BRA" }), "resolve Brasil pela sigla BRA");
check(getCountryValueForNewDraft(countries) === "77", "novo rascunho usa o ID retornado de Brasil");
check(
  getCountryValueForNewDraft(countries, "44") === "44",
  "seleção não brasileira existente é preservada",
);
check(getCountryValueForReset(countries) === "77", "reset cria novo rascunho com Brasil");
check(
  filterSearchableOptions(banks, "nub")
    .map((bank) => bank.value)
    .join() === "42",
  "busca filtra Nubank",
);
check(
  getSelectedSearchableOption(banks, "42")?.label === "Nubank",
  "valor selecionado string é preservado",
);
check(toNumericPayloadId("42") === 42, "payload transforma referência selecionada em número");
check(
  normalizeSubdivisionForPayload(countries[1], " sp ") === "SP" &&
    normalizeSubdivisionForPayload(countries[2], " New South Wales ") === "New South Wales",
  "payload normaliza UF brasileira sem alterar região internacional",
);
check(pageSource.includes("getCountries()"), "carrega o catálogo público de países");
check(
  pageSource.includes("country_id: toNumericPayloadId(draft.countryId)"),
  "payload envia country_id selecionado",
);
check(
  pageSource.includes("bank_id: toNumericPayloadId(draft.bankName)"),
  "payload bancário permanece numérico",
);
check(
  (pageSource.match(/<SearchableCombobox/g) ?? []).length === 2,
  "combobox reutilizado apenas para país e banco",
);
check(
  pageSource.includes("isValidWhatsAppGroupUrl(draft.whatsapp)"),
  "validação de WhatsApp permanece inalterada",
);
check(
  pageSource.includes("whatsapp_group: draft.whatsapp.trim(),"),
  "payload de WhatsApp permanece inalterado",
);

console.log(`opportunity-creation: ${count} assertions passed`);
