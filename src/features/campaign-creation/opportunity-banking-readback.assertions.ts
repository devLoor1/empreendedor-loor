import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractOpportunityProfilePrefill, mergeOpportunityProfilePrefill } from "./opportunity-profile-prefill.ts";
import { opportunityBankingReadbackMatches, readOpportunityBanking } from "./opportunity-banking-readback.ts";

let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

const profile = { data: {
  bank_account: { bank_id: 8, agency: "0001", account: "123456", account_digit: "9" },
  pix: { type: "email", key: "perfil@example.test" },
} };
const profileDefaults = extractOpportunityProfilePrefill(null, null, profile, [8]).values;
const draft = {
  responsibleCpf: "", countryId: "1", zipCode: "", state: "", city: "", district: "",
  street: "", number: "", complement: "",
  bankName: "", agency: "", account: "", accountDigit: "", pixType: "phone", pixKey: "",
};
const seeded = mergeOpportunityProfilePrefill(draft, profileDefaults, new Set());
check(seeded.bankName === "8" && seeded.account === "123456", "perfil inicia somente novo rascunho bancário");
check(seeded.pixType === "email" && seeded.pixKey === "perfil@example.test", "perfil inicia Pix do novo rascunho");
const edited = mergeOpportunityProfilePrefill(
  { ...draft, account: "999", pixKey: "manual@example.test" },
  profileDefaults,
  new Set(["account", "pixKey"]),
);
check(edited.bankName === "" && edited.account === "999", "resposta tardia não mistura nem sobrescreve banco editado");
check(edited.pixType === "phone" && edited.pixKey === "manual@example.test", "resposta tardia não sobrescreve Pix editado");

const saved = {
  id: 41,
  bank_account: { bank_id: 12, agency: "4321", account: "777777", account_digit: "0" },
  pix: { type: "random", key: "saved-opportunity-key" },
};
const savedBanking = readOpportunityBanking(saved);
check(savedBanking?.bank_account.bank_id === 12 && savedBanking.bank_account.account === "777777", "show da Opportunity prevalece sobre default bancário do perfil");
check(savedBanking?.pix.type === "random" && savedBanking.pix.key === "saved-opportunity-key", "show da Opportunity prevalece sobre default Pix do perfil");
check(readOpportunityBanking(JSON.parse(JSON.stringify(saved)))?.pix.key === "saved-opportunity-key", "nova leitura/reconstrução mantém a cópia salva");
check(opportunityBankingReadbackMatches(savedBanking!, saved), "readback de create confirma ambos os objetos");
check(!opportunityBankingReadbackMatches({ ...savedBanking!, pix: { type: "email", key: "perfil@example.test" } }, saved), "valor do perfil não substitui Pix persistido");

const historicalCpf = {
  ...saved,
  pix: { type: "cpf", key: "12345678909" },
};
const historicalCpfReadback = readOpportunityBanking(historicalCpf);
check(
  historicalCpfReadback?.pix.type === "cpf" &&
    historicalCpfReadback.pix.key === "12345678909",
  "Opportunity histórica com Pix CPF permanece legível",
);
check(
  opportunityBankingReadbackMatches(historicalCpfReadback!, historicalCpf),
  "readback histórico com Pix CPF permanece comparável",
);

const cleared = { bank_account: { bank_id: null, agency: null, account: null, account_digit: null }, pix: { type: null, key: null } };
assert.deepEqual(readOpportunityBanking(cleared), cleared);
count += 1;
check(!opportunityBankingReadbackMatches(savedBanking!, cleared), "nulos salvos não recebem fallback do perfil");
check(readOpportunityBanking({ bank_account: null, pix: profile.data.pix }) === null, "shape ausente não é confundido com nulo salvo");
check(readOpportunityBanking({ bank_account: saved.bank_account, pix: {} }) === null, "Pix ausente não é fabricado");

const createSource = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
const detailSource = readFileSync(new URL("../../pages/campanha-detalhe.tsx", import.meta.url), "utf8");
const editSource = readFileSync(new URL("../campaign-edit/owner-content-edit.ts", import.meta.url), "utf8");
check(createSource.includes("opportunityBankingReadbackMatches(payload, readback?.data)"), "create faz GET único após ID e reconcilia banco/Pix");
check(createSource.includes("bank_account: {") && createSource.includes("pix: {"), "serialização do create mantém banco/Pix próprios da Opportunity");
check(createSource.includes("setCreatedOpportunityId(id)"), "create preserva ID para impedir repetição após readback incerto");
check(detailSource.includes("readOpportunityBanking(opp)"), "detail reconstrói banco/Pix somente do GET da Opportunity");
check(!detailSource.includes("getBankingInformation("), "detail não usa o perfil como fallback para a Opportunity salva");
check(!editSource.includes("bank_account") && !editSource.includes("pix"), "PATCH atual não expõe edição nested fora de BR-03");

console.log(`opportunity-banking-readback: ${count} assertions passed`);
