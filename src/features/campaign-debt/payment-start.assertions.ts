import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isIsoDate } from "./debt-summary.ts";

assert.equal(isIsoDate("2026-12-01"), true);
assert.equal(isIsoDate("2026-02-30"), false);
assert.equal(isIsoDate("2026-9-1"), false);
assert.equal(isIsoDate(null), false);

const createPage = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
const debtPage = readFileSync(new URL("../../pages/campanha-divida.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../../services/api.ts", import.meta.url), "utf8");

assert.match(createPage, /payment_start_at: draft\.paymentStartAt \|\| null/);
assert.match(createPage, /readback\?\.data\?\.debt\?\.payment_start_at/);
assert.match(createPage, /setCreatedOpportunityId\(id\)/);
assert.match(createPage, /createdReadbackError/);
assert.match(debtPage, /debt\.opportunity\.status !== "review"/);
assert.match(debtPage, /await updateDebtSchedule\(Number\(id\), \{ payment_start_at: nextDate \}\)/);
assert.match(debtPage, /getDebtSummary\(Number\(id\)\), getDebt\(Number\(id\)\)/);
assert.match(debtPage, /setPendingDateReadback\(nextDate\)/);
assert.match(debtPage, /Tentar confirmar leitura/);
assert.match(api, /export async function updateDebtSchedule/);
console.log("Payment start date assertions passed.");
