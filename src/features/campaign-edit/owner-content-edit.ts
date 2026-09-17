export type OwnerContent = {
  id: number;
  status: string;
  about: string;
  description: string;
  promotional_video_url: string | null;
};

export type OwnerContentDraft = {
  about: string;
  description: string;
  promotional_video_url: string;
};

export type OwnerContentPatch = Partial<Pick<OwnerContent, "about" | "description" | "promotional_video_url">>;

export function canEditOwnerContent(status: string): boolean {
  return status === "review" || status === "active";
}

export function toOwnerContentDraft(opportunity: OwnerContent): OwnerContentDraft {
  return {
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
  const about = draft.about.trim();
  const description = draft.description.trim();
  const video = draft.promotional_video_url.trim() || null;

  if (about !== (opportunity.about ?? "").trim()) patch.about = about;
  if (description !== (opportunity.description ?? "").trim()) patch.description = description;
  if (video !== (opportunity.promotional_video_url?.trim() || null)) {
    patch.promotional_video_url = video;
  }

  return patch;
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
