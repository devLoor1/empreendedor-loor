import { onlyDigits } from "../../utils/br-formatters.ts";
import { validateUploadFile } from "../../utils/upload-validation.ts";

export const OPPORTUNITY_IMAGE_MAX_SIZE_BYTES = 20 * 1024 * 1024;
export const OPPORTUNITY_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

export function validateOpportunityImage(file: File) {
  return validateUploadFile(file, {
    allowedExtensions: OPPORTUNITY_IMAGE_EXTENSIONS,
    maxSizeBytes: OPPORTUNITY_IMAGE_MAX_SIZE_BYTES,
    invalidTypeMessage: "Use uma imagem PNG, JPG ou JPEG.",
    maxSizeMessage: "A imagem deve ter até 20 MiB.",
  });
}

type OpportunityContentDraft = {
  opportunityName: string;
  businessName: string;
  about: string;
  shortDescription: string;
  documentNumber: string;
  responsibleCpf: string;
  speCnpj: string;
  segment: string;
  resourceUtilization: string;
  videoUrl: string;
};

export function buildOpportunityContentPayload(draft: OpportunityContentDraft, imageId: number) {
  return {
    image_id: imageId,
    segment_id: Number(draft.segment),
    about: draft.about.trim(),
    business_name: draft.businessName.trim(),
    company_cnpj: onlyDigits(draft.documentNumber),
    cpf: onlyDigits(draft.responsibleCpf),
    promotional_video_url: draft.videoUrl.trim() || null,
    description: draft.shortDescription.trim(),
    name: draft.opportunityName.trim(),
    resource_utilization: draft.resourceUtilization,
    spe_cnpj: onlyDigits(draft.speCnpj),
  };
}
