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
  const digits = rawDigits.startsWith("55") && rawDigits.length > 11 ? rawDigits.slice(-11) : rawDigits;
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
  const normalizedInput = normalizeBrazilianMoneyInput(value);

  if (!normalizedInput) return 0;

  const hasComma = normalizedInput.includes(",");
  const validBrazilianPattern = hasComma
    ? /^(\d+|\d{1,3}(\.\d{3})+),\d{1,2}$/.test(normalizedInput)
    : /^(\d+|\d{1,3}(\.\d{3})+)$/.test(normalizedInput);

  if (!validBrazilianPattern) return 0;

  const normalized = normalizedInput.replace(/\./g, "").replace(",", ".");
  const numeric = Number.parseFloat(normalized);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

export function parseMoneyToNumber(value: string) {
  return parseBrazilianMoneyToNumber(value);
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
