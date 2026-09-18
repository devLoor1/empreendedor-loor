import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatDebtSummaryDate, parseDebtSummary } from "./debt-summary.ts";

const response = {
  base_date: "2026-12-01",
  first_due: "2027-03-01",
  payment_start_at: "2026-12-01",
  grace_period: 3,
  total_installments: 2,
  payment_frequency: "mensal",
  percentage_profitability: "1.25",
  profitability_basis: "annual",
  parcelas: [
    { installment_number: 1, due_date: "2027-03-01", projected_amount: "1000.05" },
    { installment_number: 2, due_date: "2027-04-01", projected_amount: "1000.05" },
  ],
};

assert.deepEqual(parseDebtSummary(response), response);
assert.equal(formatDebtSummaryDate("2027-03-01"), "01/03/2027");
assert.equal(formatDebtSummaryDate("2027-02-30"), "—");
assert.deepEqual(parseDebtSummary({ ...response, payment_start_at: null }), { ...response, payment_start_at: null });
assert.equal(parseDebtSummary({ ...response, base_date: "2026-02-30" }), null);
assert.equal(parseDebtSummary({ ...response, profitability_basis: "monthly" })?.profitability_basis, "monthly");
assert.equal(parseDebtSummary({ ...response, profitability_basis: undefined })?.profitability_basis, null);
assert.equal(parseDebtSummary({ ...response, profitability_basis: "daily" }), null);
assert.equal(parseDebtSummary({ ...response, parcelas: [{ ...response.parcelas[0], projected_amount: "1,000.05" }] }), null);

const page = readFileSync(new URL("../../pages/campanha-divida.tsx", import.meta.url), "utf8");
assert.match(page, /getDebtSummary\(Number\(id\)\)/);
assert.match(page, /parseDebtSummary\(response\?\.data\)/);
assert.doesNotMatch(page, /formatBRLFromCents\(row\.projected_amount\)/);
assert.match(page, /Projeção não indica parcela gerada, cobrada ou paga/);
console.log("Authoritative debt summary assertions passed.");
