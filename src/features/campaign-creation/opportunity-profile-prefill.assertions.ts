import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  extractOpportunityProfilePrefill,
  mergeOpportunityProfilePrefill,
} from "./opportunity-profile-prefill.ts";

let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

const personal = { data: { cpf: "12345678909" } };
const address = {
  data: {
    country_id: 2,
    zip_code: "A1B 2C3",
    state: "ON",
    city: "Toronto",
    district: "Centro",
    street_name: "Rua Exemplo",
    number: "42",
    complement: "Sala 7",
  },
};
const banking = {
  data: {
    bank_account: { bank_id: 8, agency: "0001", account: "123456", account_digit: "9" },
    pix: { type: "email", key: "contato@example.test" },
  },
};
const original = JSON.stringify([personal, address, banking]);
const { values, bankNeedsSelection } = extractOpportunityProfilePrefill(
  personal,
  address,
  banking,
  [8],
);
check(!bankNeedsSelection, "banco ativo pode ser copiado");
assert.deepEqual(values, {
  responsibleCpf: "123.456.789-09",
  countryId: "2",
  zipCode: "A1B 2C3",
  state: "ON",
  city: "Toronto",
  district: "Centro",
  street: "Rua Exemplo",
  number: "42",
  complement: "Sala 7",
  bankName: "8",
  agency: "0001",
  account: "123456",
  accountDigit: "9",
  pixType: "email",
  pixKey: "contato@example.test",
});
count += 1;

const blank = {
  responsibleCpf: "",
  countryId: "1",
  zipCode: "",
  state: "",
  city: "",
  district: "",
  street: "",
  number: "",
  complement: "",
  bankName: "",
  agency: "",
  account: "",
  accountDigit: "",
  pixType: "cpf",
  pixKey: "",
  opportunityName: "Minha oferta",
};
const merged = mergeOpportunityProfilePrefill(blank, values, new Set<string>());
check(
  merged.countryId === "2" && merged.pixType === "email",
  "perfil substitui somente defaults automáticos não editados",
);
check(
  merged.city === "Toronto" && merged.bankName === "8" && merged.pixKey === "contato@example.test",
  "endereço e banco copiados para o rascunho",
);
check(merged.opportunityName === "Minha oferta", "campos próprios da oferta são preservados");
check(
  JSON.stringify([personal, address, banking]) === original,
  "dados de perfil nunca são alterados pela cópia",
);

const edited = mergeOpportunityProfilePrefill(
  { ...blank, city: "Cidade manual", street: "", account: "99999", pixType: "random" },
  values,
  new Set(["street", "account", "pixType"]),
);
check(
  edited.city === "Cidade manual" && edited.street === "",
  "campo manual preenchido ou limpo não é sobrescrito",
);
check(
  edited.bankName === "" && edited.account === "99999",
  "edição bancária impede mistura de contas",
);
check(
  edited.pixType === "random" && edited.pixKey === "",
  "edição de tipo Pix impede chave incompatível",
);

const inactive = extractOpportunityProfilePrefill(personal, address, banking, [9]);
check(
  inactive.bankNeedsSelection && !inactive.values.bankName,
  "banco fora do catálogo exige seleção manual",
);
check(
  extractOpportunityProfilePrefill(null, { data: null }, {}, []).values.countryId === undefined,
  "perfil incompleto não fabrica país",
);

const source = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
check(
  source.includes("mergeOpportunityProfilePrefill(current, values, touchedDraftFieldsRef.current)"),
  "merge ocorre na resposta com estado de edição atual",
);
check(
  source.includes("complement: draft.complement.trim() || null"),
  "complemento é serializado na cópia da oportunidade",
);
check(
  !source.includes("saveAddress(") && !source.includes("saveBankingInformation("),
  "create não escreve nos endpoints de perfil",
);

console.log(`opportunity-profile-prefill: ${count} assertions passed`);
