import { formatCpf, onlyDigits } from "../../utils/br-formatters.ts";

export type OpportunityProfilePrefill = Partial<{
  responsibleCpf: string;
  countryId: string;
  zipCode: string;
  state: string;
  city: string;
  district: string;
  street: string;
  number: string;
  complement: string;
  bankName: string;
  agency: string;
  account: string;
  accountDigit: string;
  pixType: string;
  pixKey: string;
}>;

type PrefillKey = keyof OpportunityProfilePrefill;

const PIX_TYPES = new Set(["cpf", "cnpj", "phone", "email", "random"]);
const BANK_FIELDS: PrefillKey[] = ["bankName", "agency", "account", "accountDigit"];
const PIX_FIELDS: PrefillKey[] = ["pixType", "pixKey"];

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function data(response: unknown) {
  const result = record(response);
  return record(result?.data);
}

function nonempty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Copies only authoritative profile fields that map to the existing Opportunity create contract. */
export function extractOpportunityProfilePrefill(
  personalResponse: unknown,
  addressResponse: unknown,
  bankingResponse: unknown,
  activeBankIds: readonly number[],
) {
  const values: OpportunityProfilePrefill = {};
  const personal = data(personalResponse);
  const address = data(addressResponse);
  const banking = data(bankingResponse);
  const bankAccount = record(banking?.bank_account);
  const pix = record(banking?.pix);
  let bankNeedsSelection = false;

  const cpf = nonempty(personal?.cpf);
  if (onlyDigits(cpf).length === 11) values.responsibleCpf = formatCpf(cpf);

  const countryId = Number(address?.country_id);
  if (Number.isInteger(countryId) && countryId > 0) values.countryId = String(countryId);
  const zipCode = nonempty(address?.zip_code);
  if (zipCode) values.zipCode = zipCode;
  for (const [source, target] of [
    ["state", "state"],
    ["city", "city"],
    ["district", "district"],
    ["street_name", "street"],
    ["number", "number"],
    ["complement", "complement"],
  ] as const) {
    const value = nonempty(address?.[source]);
    if (value) values[target] = value;
  }

  const bankId = Number(bankAccount?.bank_id);
  if (Number.isInteger(bankId) && bankId > 0) {
    if (activeBankIds.includes(bankId)) values.bankName = String(bankId);
    else bankNeedsSelection = true;
  }
  for (const [source, target] of [
    ["agency", "agency"],
    ["account", "account"],
    ["account_digit", "accountDigit"],
  ] as const) {
    const value = nonempty(bankAccount?.[source]);
    if (value) values[target] = value;
  }

  const pixType = nonempty(pix?.type);
  const pixKey = nonempty(pix?.key);
  if (PIX_TYPES.has(pixType) && pixKey) {
    values.pixType = pixType;
    values.pixKey = pixKey;
  }

  return { values, bankNeedsSelection };
}

/** Called at response time so even edits made while the GETs were in flight win. */
export function mergeOpportunityProfilePrefill<T extends Record<PrefillKey, string>>(
  current: T,
  prefill: OpportunityProfilePrefill,
  touched: ReadonlySet<string>,
): T {
  const next: Record<PrefillKey, string> = { ...current };
  const bankTouched = BANK_FIELDS.some((field) => touched.has(field));
  const pixTouched = PIX_FIELDS.some((field) => touched.has(field));

  for (const [field, value] of Object.entries(prefill) as [PrefillKey, string][]) {
    if (!value || touched.has(field)) continue;
    if (BANK_FIELDS.includes(field) && bankTouched) continue;
    if (PIX_FIELDS.includes(field) && pixTouched) continue;
    // Country is an untouched automatic Brazil default; a persisted country wins.
    // Pix type is an untouched default only when the key is also being copied.
    if (field !== "countryId" && field !== "pixType" && next[field].trim()) continue;
    next[field] = value;
  }

  return next as T;
}
