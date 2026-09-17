import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildOpportunityContentPayload,
  OPPORTUNITY_IMAGE_MAX_SIZE_BYTES,
  validateOpportunityImage,
} from "./opportunity-form-contract.ts";

let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

const content = buildOpportunityContentPayload(
  {
    opportunityName: "  Oferta QA  ",
    businessName: "  Empresa QA  ",
    about: "  Sobre a oferta  ",
    shortDescription: "  Resumo da oferta  ",
    responsibleCpf: "123.456.789-09",
    speCnpj: "98.765.432/0001-10",
    segment: "42",
    resourceUtilization: "working_capital",
    videoUrl: "  ",
  },
  73,
  "12.345.678/0001-90",
);

assert.deepEqual(content, {
  image_id: 73,
  segment_id: 42,
  about: "Sobre a oferta",
  business_name: "Empresa QA",
  company_cnpj: "12345678000190",
  cpf: "12345678909",
  promotional_video_url: null,
  description: "Resumo da oferta",
  name: "Oferta QA",
  resource_utilization: "working_capital",
  spe_cnpj: "98765432000110",
});
count += 1;

check(OPPORTUNITY_IMAGE_MAX_SIZE_BYTES === 20 * 1024 * 1024, "limite de imagem é 20 MiB");
const exactLimit = new File([new Uint8Array(OPPORTUNITY_IMAGE_MAX_SIZE_BYTES)], "banner.PNG");
const accepted = validateOpportunityImage(exactLimit);
check(
  accepted.error === null && accepted.file?.name === "banner.png",
  "20 MiB e extensão normalizada aceitos",
);
const tooLarge = new File([new Uint8Array(OPPORTUNITY_IMAGE_MAX_SIZE_BYTES + 1)], "banner.jpg");
check(validateOpportunityImage(tooLarge).file === null, "acima de 20 MiB rejeitado");
check(
  validateOpportunityImage(new File(["image"], "banner.gif")).file === null,
  "extensão fora do contrato rejeitada",
);

const source = readFileSync(new URL("../../pages/campanha-nova.tsx", import.meta.url), "utf8");
check(
  source.includes("opportunity: buildOpportunityContentPayload(draft, imageId, latestCompany.cnpj)"),
  "create usa o CNPJ canônico lido da API no serializer testado",
);
check(!source.includes("onPatch({ documentNumber:"), "CNPJ da Opportunity não tem entrada independente");
check(source.includes("readCompanyInformation(await getCompanyInformation())"), "create reconcilia a Company antes de upload/submit");
check(
  source.includes("members: []"),
  "sem equipe coletada, envia array vazio aceito pelo contrato",
);
for (const discarded of [
  "teamMembers",
  "cardSubtitle",
  "guarantees",
  "galleryNotes",
  "heroImageNote",
  "extraVideoUrl",
  "longDescription",
]) {
  check(!source.includes(discarded), `${discarded} não é solicitado nem exigido pelo wizard`);
}
check(source.includes("20 MiB cada"), "copy das imagens extras corresponde ao validator");
check(source.includes("até 20 MiB"), "copy da imagem principal corresponde ao validator");
check(
  source.includes("endereço e CNPJ canônico salvo no Perfil da empresa"),
  "pré-requisitos da campanha incluem o CNPJ canônico",
);
const readinessSource = readFileSync(new URL("../../hooks/use-campaign-readiness.ts", import.meta.url), "utf8");
check(
  !readinessSource.includes("até existir contrato canônico de empresa"),
  "readiness não anuncia contrato canônico inexistente",
);

console.log(`opportunity-form-contract: ${count} assertions passed`);
