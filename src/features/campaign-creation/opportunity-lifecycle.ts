/** Backend resources sometimes stringify absent nullable dates as the literal "null". */
export function parseOpportunityDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim() || value.trim().toLowerCase() === "null") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatOpportunityDate(value: unknown) {
  const date = parseOpportunityDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "—";
}
