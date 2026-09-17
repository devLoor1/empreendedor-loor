export type OwnerContent = {
  id: number;
  status: string;
  name: string;
  business_name: string;
  about: string;
  description: string;
  promotional_video_url: string | null;
};

export type OwnerContentDraft = {
  name: string;
  business_name: string;
  about: string;
  description: string;
  promotional_video_url: string;
};

export type OwnerContentPatch = Partial<
  Pick<OwnerContent, "name" | "business_name" | "about" | "description" | "promotional_video_url">
>;

export function canEditOwnerContent(status: string): boolean {
  return status === "review" || status === "active";
}

export function toOwnerContentDraft(opportunity: OwnerContent): OwnerContentDraft {
  return {
    name: opportunity.name ?? "",
    business_name: opportunity.business_name ?? "",
    about: opportunity.about ?? "",
    description: opportunity.description ?? "",
    promotional_video_url: opportunity.promotional_video_url ?? "",
  };
}

export function buildOwnerContentPatch(
  opportunity: OwnerContent,
  draft: OwnerContentDraft,
): OwnerContentPatch {
  if (!canEditOwnerContent(opportunity.status)) return {};

  const patch: OwnerContentPatch = {};
  const name = draft.name.trim();
  const businessName = draft.business_name.trim();
  const about = draft.about.trim();
  const description = draft.description.trim();
  const video = draft.promotional_video_url.trim() || null;

  if (name !== (opportunity.name ?? "").trim()) patch.name = name;
  if (businessName !== (opportunity.business_name ?? "").trim()) {
    patch.business_name = businessName;
  }
  if (about !== (opportunity.about ?? "").trim()) patch.about = about;
  if (description !== (opportunity.description ?? "").trim()) patch.description = description;
  if (video !== (opportunity.promotional_video_url?.trim() || null)) {
    patch.promotional_video_url = video;
  }

  return patch;
}

export function ownerContentSourceMatches(
  expected: OwnerContent,
  current: OwnerContent | null,
): boolean {
  if (!current || current.id !== expected.id || current.status !== expected.status) return false;

  return current.name === expected.name &&
    current.business_name === expected.business_name &&
    current.about === expected.about &&
    current.description === expected.description &&
    current.promotional_video_url === expected.promotional_video_url;
}

export function validateOwnerIdentityPatch(patch: OwnerContentPatch): string | null {
  if ((patch.name !== undefined && !patch.name) ||
      (patch.business_name !== undefined && !patch.business_name)) {
    return "Nome da oportunidade e nome empresarial não podem ficar vazios.";
  }

  if ((patch.name?.length ?? 0) > 255 || (patch.business_name?.length ?? 0) > 255) {
    return "Nome da oportunidade e nome empresarial devem ter no máximo 255 caracteres.";
  }

  return null;
}

export function ownerContentReadbackMatches(
  original: OwnerContent,
  patch: OwnerContentPatch,
  readback: OwnerContent | null,
): boolean {
  if (!readback || readback.id !== original.id) return false;
  return Object.entries(patch).every(([key, expected]) => {
    const actual = readback[key as keyof OwnerContent];
    return actual === expected;
  });
}
