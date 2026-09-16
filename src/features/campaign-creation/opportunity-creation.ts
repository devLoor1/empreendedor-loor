import { parseBrazilianMoneyToCents } from "../../utils/br-formatters.ts";

export type CountryReference = {
  id: number;
  name: string;
  abbreviation?: string | null;
};

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function isBrazilCountry(country?: Pick<CountryReference, "name" | "abbreviation"> | null) {
  const name = normalizeSearchValue(country?.name ?? "");
  const abbreviation = country?.abbreviation?.trim().toUpperCase();

  return abbreviation === "BR" || abbreviation === "BRA" || name === "brasil" || name === "brazil";
}

export function getBrazilCountryId(countries: readonly CountryReference[]) {
  const brazil = countries.find(isBrazilCountry);

  return brazil ? String(brazil.id) : "";
}

/** Keeps a persisted or in-progress selection; only a blank new draft defaults to Brazil. */
export function getCountryValueForNewDraft(
  countries: readonly CountryReference[],
  currentValue = "",
) {
  return currentValue || getBrazilCountryId(countries);
}

/** A reset starts a fresh creation draft and therefore restores the Brazil default. */
export function getCountryValueForReset(countries: readonly CountryReference[]) {
  return getBrazilCountryId(countries);
}

export function filterSearchableOptions(options: readonly SearchableOption[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return [...options];

  return options.filter((option) =>
    normalizeSearchValue(`${option.label} ${option.keywords ?? ""}`).includes(normalizedQuery),
  );
}

export function getSelectedSearchableOption(options: readonly SearchableOption[], value: string) {
  return options.find((option) => option.value === value) ?? null;
}

export function normalizeSubdivisionForPayload(
  country: Pick<CountryReference, "name" | "abbreviation"> | null,
  value: string,
) {
  const trimmed = value.trim();
  return isBrazilCountry(country) ? trimmed.toUpperCase() : trimmed;
}

/** Form controls retain string values; API reference fields remain numeric. */
export function toNumericPayloadId(value: string) {
  return Number(value);
}

/** Serializes BRL form values once into the Backend's integer-cent contract. */
export function buildOpportunityMonetaryPayload(
  maxGoal: string,
  minInvestmentValue: string,
  warrantyAmount = "0",
) {
  return {
    max_goal: parseBrazilianMoneyToCents(maxGoal),
    min_investment_value: parseBrazilianMoneyToCents(minInvestmentValue),
    warranty_amount: parseBrazilianMoneyToCents(warrantyAmount),
  };
}
