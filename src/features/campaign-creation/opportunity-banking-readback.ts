export type OpportunityBankingReadback = {
  bank_account: {
    bank_id: number | null;
    agency: string | null;
    account: string | null;
    account_digit: string | null;
  };
  pix: {
    type: string | null;
    key: string | null;
  };
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasNullableString(value: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(value, key) && (value[key] === null || typeof value[key] === "string");
}

/** Saved Opportunity show data is authoritative; a missing/malformed shape is not a profile fallback. */
export function readOpportunityBanking(value: unknown): OpportunityBankingReadback | null {
  const opportunity = record(value);
  const bank = record(opportunity?.bank_account);
  const pix = record(opportunity?.pix);
  if (!bank || !pix) return null;
  if (!Object.hasOwn(bank, "bank_id") ||
      (bank.bank_id !== null && (!Number.isInteger(bank.bank_id) || Number(bank.bank_id) <= 0))) return null;
  if (!["agency", "account", "account_digit"].every((key) => hasNullableString(bank, key))) return null;
  if (!["type", "key"].every((key) => hasNullableString(pix, key))) return null;

  return {
    bank_account: {
      bank_id: bank.bank_id as number | null,
      agency: bank.agency as string | null,
      account: bank.account as string | null,
      account_digit: bank.account_digit as string | null,
    },
    pix: { type: pix.type as string | null, key: pix.key as string | null },
  };
}

/** Used only after create returns an ID; a mismatch must never trigger a second create. */
export function opportunityBankingReadbackMatches(
  expected: OpportunityBankingReadback,
  show: unknown,
): boolean {
  const saved = readOpportunityBanking(show);
  if (!saved) return false;
  return saved.bank_account.bank_id === expected.bank_account.bank_id &&
    saved.bank_account.agency === expected.bank_account.agency &&
    saved.bank_account.account === expected.bank_account.account &&
    saved.bank_account.account_digit === expected.bank_account.account_digit &&
    saved.pix.type === expected.pix.type &&
    saved.pix.key === expected.pix.key;
}
