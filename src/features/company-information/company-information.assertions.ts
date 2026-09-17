import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  companyFormMatches,
  companySavePayload,
  readCompanyInformation,
  toCompanyForm,
} from "./company-information.ts";

const persisted = readCompanyInformation({
  data: {
    id: 29,
    cnpj: "12345678000195",
    name: "Empresa QA",
    fantasy_name: null,
    phone: null,
    email: null,
    validation_status: "pending",
    validation_source: null,
    validated_at: null,
  },
});
assert.ok(persisted);
assert.equal(readCompanyInformation({ data: null }), null, "ausência canônica é distinta de erro");
assert.throws(() => readCompanyInformation({}), /inválida/, "resposta malformada não vira empresa vazia");

const form = toCompanyForm(persisted);
assert.equal(form.legal_name, "Empresa QA");
assert.equal(form.trade_name, "");
assert.ok(companyFormMatches(persisted, { ...form, cnpj: "12.345.678/0001-95" }));
assert.equal(companyFormMatches(persisted, { ...form, legal_name: "Outro nome" }), false);
assert.deepEqual(companySavePayload({
  cnpj: "12.345.678/0001-95",
  legal_name: " Empresa QA ",
  trade_name: " ",
  phone: " ",
  email: " ",
}), {
  cnpj: "12345678000195",
  name: "Empresa QA",
  fantasy_name: null,
  phone: null,
  email: null,
  validate: false,
});

const api = readFileSync(new URL("../../services/api.ts", import.meta.url), "utf8");
assert.match(api, /apiFetch\('\/entrepreneurs\/company-information'\)/);
assert.match(api, /apiFetch\('\/entrepreneurs\/company-information\/validate'/);
assert.match(api, /method: 'PUT'/);

const page = readFileSync(new URL("../../pages/perfil-empresa.tsx", import.meta.url), "utf8");
assert.match(page, /const persisted = readCompanyInformation\(await getCompanyInformation\(\)\)/);
assert.match(page, /await saveCompanyInformation\(payload\)/);
assert.match(page, /await validateCompanyInformation\(\)/);
assert.doesNotMatch(page, /lookupCnpjInfo|CNPJ validado localmente/);

console.log("Company information contract assertions passed.");
