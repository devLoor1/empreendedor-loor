export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string) {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCnpj(value: string) {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value);

  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}

export function formatCep(value: string) {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatBrazilPhone(value: string) {
  const rawDigits = onlyDigits(value);
  const digits =
    rawDigits.startsWith("55") && rawDigits.length > 11 ? rawDigits.slice(-11) : rawDigits;
  const limited = digits.slice(0, 11);

  if (limited.length <= 10) {
    return limited.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  return limited.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatAgency(value: string) {
  return onlyDigits(value).slice(0, 4);
}

export function formatBankAccount(value: string) {
  return onlyDigits(value).slice(0, 16);
}

export function formatAccountDigit(value: string) {
  return onlyDigits(value).slice(0, 1);
}

export function formatDecimalInput(value: string) {
  return value
    .replace(/[^\d,.]/g, "")
    .replace(/(,.*),/g, "$1")
    .slice(0, 20);
}

export function normalizeBrazilianMoneyInput(value: string) {
  return value.replace(/[^\d,.]/g, "").trim();
}

export function parseBrazilianMoneyToNumber(value: string) {
  return parseBrazilianMoneyToCents(value) / 100;
}

export function parseMoneyToNumber(value: string) {
  return parseBrazilianMoneyToNumber(value);
}

/** Converts a user-entered BRL amount to the API's integer-cent representation. */
export function parseBrazilianMoneyToCents(value: string) {
  const normalizedInput = normalizeBrazilianMoneyInput(value);
  const match = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/.exec(normalizedInput);

  if (!match) return 0;

  const wholeReais = Number(match[1].replace(/\./g, ""));
  const fractionalCents = Number((match[2] ?? "").padEnd(2, "0"));
  const cents = wholeReais * 100 + fractionalCents;

  return Number.isSafeInteger(cents) && cents > 0 ? cents : 0;
}

/** Parses an ungrouped decimal typed with either the Brazilian or dot separator. */
export function parseLocaleDecimalNumber(value: string) {
  const normalized = value.trim().replace("%", "").trim();

  if (!/^\d+(?:[,.]\d+)?$/.test(normalized)) return 0;

  const numeric = Number(normalized.replace(",", "."));

  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

const brlCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formats one API cent value as BRL. Call exactly once at the display boundary. */
export function formatBRLFromCents(cents: number) {
  return brlCurrencyFormatter.format(Number.isFinite(cents) ? cents / 100 : 0);
}

export function isValidCepShape(value: string) {
  return onlyDigits(value).length === 8;
}

export function isValidCpfShape(value: string) {
  return onlyDigits(value).length === 11;
}

export function isValidCnpjShape(value: string) {
  return onlyDigits(value).length === 14;
}

export function isValidPhoneShape(value: string) {
  const digits = onlyDigits(value);
  const localDigits = digits.startsWith("55") && digits.length > 11 ? digits.slice(-11) : digits;

  return localDigits.length >= 10 && localDigits.length <= 11;
}

export function normalizePixKeyByType(type: string, value: string) {
  const trimmed = value.trim();

  if (type === "cpf" || type === "cnpj") return onlyDigits(trimmed);
  if (type === "phone") {
    const digits = onlyDigits(trimmed);
    return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
  }
  if (type === "email") return trimmed.toLowerCase();

  return trimmed.toLowerCase();
}
