export type OpportunityCreationModality = "debt" | "equity";

const ALL_OPPORTUNITY_CREATION_MODALITIES: readonly OpportunityCreationModality[] = [
  "debt",
  "equity",
];

export function isFinapopPlatform(platformSlug: unknown): boolean {
  return typeof platformSlug === "string" && platformSlug.trim().toLowerCase().includes("finapop");
}

export function getOpportunityCreationModalities(
  platformSlug: unknown,
): readonly OpportunityCreationModality[] {
  return isFinapopPlatform(platformSlug) ? ["debt"] : ALL_OPPORTUNITY_CREATION_MODALITIES;
}

export function isOpportunityCreationModalityAllowed(
  modality: unknown,
  platformSlug: unknown,
): modality is OpportunityCreationModality {
  return getOpportunityCreationModalities(platformSlug).includes(
    modality as OpportunityCreationModality,
  );
}

export function requireOpportunityCreationModality(
  modality: unknown,
  platformSlug: unknown,
): OpportunityCreationModality {
  if (!isOpportunityCreationModalityAllowed(modality, platformSlug)) {
    throw new Error(
      "A modalidade selecionada não está disponível para novas oportunidades nesta plataforma.",
    );
  }

  return modality;
}
