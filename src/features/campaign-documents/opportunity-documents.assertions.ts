import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  canCreateOpportunityDocument,
  canDeleteOpportunityDocument,
  canReplaceOpportunityDocument,
  isOpportunityDocumentWriteType,
  OPPORTUNITY_DOCUMENT_MAX_BYTES,
  OPPORTUNITY_DOCUMENT_WRITE_TYPES,
  opportunityDocumentReadbackMatches,
  opportunityDocumentTypeLabel,
  parseCreatedOpportunityDocumentId,
  parseOpportunityDocuments,
  safeOpportunityDocumentUrl,
  validateOpportunityDocumentFile,
  validateOpportunityDocumentName,
  type OpportunityDocument,
} from "./opportunity-documents.ts";

let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

const contract: OpportunityDocument = {
  id: 12,
  name: "Contrato",
  type: "investment_contract",
  download_link: "",
};
const financials: OpportunityDocument = {
  id: 13,
  name: "Balanço",
  type: "financial_statements",
  download_link: "https://files.example.test/13",
};
const other: OpportunityDocument = {
  id: 14,
  name: "Anexo",
  type: "other_documents",
  download_link: "https://files.example.test/14",
};

const documents = parseOpportunityDocuments({
  data: [
    contract,
    financials,
    { id: 0, name: "Inválido", type: "other_documents", download_link: "" },
    { id: 15, name: "Sem URL", type: "other_documents" },
  ],
});
check(documents.length === 2, "lista aceita somente documentos tipados com IDs positivos");
check(documents[0].type === "investment_contract", "contrato é preservado mesmo sem link direto");
check(parseOpportunityDocuments({ data: null }).length === 0, "estado vazio não fabrica documentos");
check(
  opportunityDocumentTypeLabel("financial_statements") === "Demonstrações financeiras",
  "tipo conhecido possui label",
);
check(
  opportunityDocumentTypeLabel("unknown") === "Documento da oportunidade",
  "tipo futuro tem fallback seguro",
);
check(safeOpportunityDocumentUrl("https://files.example.test/13") !== null, "link HTTPS é permitido");
check(safeOpportunityDocumentUrl("javascript:alert(1)") === null, "protocolo executável não vira link");
check(safeOpportunityDocumentUrl("/relative") === null, "link relativo sem origem não é assumido");

check(validateOpportunityDocumentName("   ") !== null, "nome vazio é rejeitado");
check(validateOpportunityDocumentName("a".repeat(128)) === null, "nome com 128 caracteres é aceito");
check(validateOpportunityDocumentName("a".repeat(129)) !== null, "nome com 129 caracteres é rejeitado");

const file = (name: string, size: number, type = "application/pdf") => ({ name, size, type });
check(validateOpportunityDocumentFile(null) !== null, "arquivo é obrigatório");
check(validateOpportunityDocumentFile(file("empty.pdf", 0)) !== null, "arquivo vazio é rejeitado");
check(validateOpportunityDocumentFile(file("valid.pdf", OPPORTUNITY_DOCUMENT_MAX_BYTES)) === null, "limite exato de 20 MiB é aceito");
check(validateOpportunityDocumentFile(file("valid.PDF", 1, "application/octet-stream")) === null, "extensão PDF não depende do MIME reportado pelo navegador");
check(validateOpportunityDocumentFile(file("invalid.png", 1)) !== null, "extensão diferente de PDF é rejeitada");
check(validateOpportunityDocumentFile(file("large.pdf", OPPORTUNITY_DOCUMENT_MAX_BYTES + 1)) !== null, "um byte acima de 20 MiB é rejeitado");

check(OPPORTUNITY_DOCUMENT_WRITE_TYPES.length === 7, "sete tipos de escrita são expostos");
check(OPPORTUNITY_DOCUMENT_WRITE_TYPES.every(isOpportunityDocumentWriteType), "todos os tipos de escrita são reconhecidos");
check(!isOpportunityDocumentWriteType("investment_contract"), "contrato gerado não é tipo de escrita");
check(!isOpportunityDocumentWriteType(""), "tipo vazio não é aceito");

check(canCreateOpportunityDocument("review", "social_contract", []), "tipo ausente pode ser criado em revisão");
check(!canCreateOpportunityDocument("review", "financial_statements", [financials]), "tipo único duplicado é bloqueado em revisão");
check(!canCreateOpportunityDocument("active", "financial_statements", [financials]), "tipo único duplicado é bloqueado em campanha ativa");
check(canCreateOpportunityDocument("active", "other_documents", [other]), "outros documentos podem ser repetidos em campanha ativa");
check(!canCreateOpportunityDocument("finished", "other_documents", []), "criação é bloqueada em campanha concluída");
check(!canCreateOpportunityDocument("archived", "other_documents", []), "criação é bloqueada em campanha arquivada");

check(canReplaceOpportunityDocument("review", financials), "documento pode ser substituído em revisão");
check(canReplaceOpportunityDocument("active", financials), "documento pode ser substituído em campanha ativa");
check(!canReplaceOpportunityDocument("active", contract), "contrato gerado nunca pode ser substituído");
check(!canReplaceOpportunityDocument("finished", financials), "substituição é bloqueada em campanha concluída");
check(!canReplaceOpportunityDocument("archived", financials), "substituição é bloqueada em campanha arquivada");

check(canDeleteOpportunityDocument("review", financials), "tipo fixo pode ser excluído em revisão");
check(canDeleteOpportunityDocument("active", other), "outros documentos podem ser excluídos em campanha ativa");
check(!canDeleteOpportunityDocument("active", financials), "tipo fixo não pode ser excluído em campanha ativa");
check(!canDeleteOpportunityDocument("review", contract), "contrato gerado nunca pode ser excluído");
check(!canDeleteOpportunityDocument("finished", other), "exclusão é bloqueada em campanha concluída");

check(parseCreatedOpportunityDocumentId({ data: { id: 41 } }) === 41, "ID positivo inteiro é lido do POST");
for (const invalidResponse of [null, {}, { data: {} }, { data: { id: 0 } }, { data: { id: -1 } }, { data: { id: 1.5 } }, { data: { id: "41" } }]) {
  check(parseCreatedOpportunityDocumentId(invalidResponse) === null, "resposta sem ID positivo inteiro não é assumida");
}

check(
  opportunityDocumentReadbackMatches(
    { kind: "create", id: 14, name: "Anexo", type: "other_documents" },
    [other],
  ),
  "criação confirma o ID, nome e tipo retornados",
);
check(
  !opportunityDocumentReadbackMatches(
    { kind: "create", id: 14, name: "Outro nome", type: "other_documents" },
    [other],
  ),
  "criação não confirma readback divergente",
);
check(
  opportunityDocumentReadbackMatches(
    { kind: "create_without_id", previousIds: [13], name: "Anexo", type: "other_documents" },
    [financials, other],
  ),
  "criação sem ID só confirma uma linha nova compatível",
);
const replacement: OpportunityDocument = { ...financials, id: 21, name: "Balanço auditado" };
check(
  opportunityDocumentReadbackMatches(
    { kind: "replace", previousId: 13, previousIds: [12, 13], name: "Balanço auditado", type: "financial_statements" },
    [contract, replacement],
  ),
  "substituição confirma remoção do ID antigo e criação de uma nova linha",
);
check(
  !opportunityDocumentReadbackMatches(
    { kind: "replace", previousId: 13, previousIds: [12, 13], name: "Balanço auditado", type: "financial_statements" },
    [contract, financials, replacement],
  ),
  "substituição não confirma enquanto o ID antigo permanecer",
);
check(opportunityDocumentReadbackMatches({ kind: "delete", id: 14 }, [financials]), "exclusão confirma a ausência do ID removido");
check(!opportunityDocumentReadbackMatches({ kind: "delete", id: 14 }, [other]), "exclusão permanece pendente enquanto o ID existir");

const detail = readFileSync(new URL("../../pages/campanha-detalhe.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../../services/api.ts", import.meta.url), "utf8");
check(detail.includes("getOpportunityDocuments(opportunityId)"), "tab lista documentos reais da oportunidade");
check(detail.includes("downloadOpportunityInvestmentContract(opportunityId, document.id)"), "contrato usa download autenticado");
check(detail.includes("uploadOpportunityDocument(opportunityId, formData)"), "UI envia documento pelo contrato real");
check(detail.includes("replaceOpportunityDocument(opportunityId, document.id, formData)"), "UI substitui documento pelo contrato real");
check(detail.includes("deleteOpportunityDocument(opportunityId, document.id)"), "UI exclui documento pelo contrato real");
check(detail.includes("retryPendingReadback") && detail.includes("Atualizar estado"), "readback pendente oferece apenas atualização de estado");
check(detail.includes("AlertDialogTitle>Excluir documento da oportunidade?"), "exclusão exige confirmação explícita");
check(detail.includes("normalizeUploadFilename"), "extensão é normalizada antes do multipart");
check(detail.includes("documentos cadastrais da empresa permanecem separados"), "UI separa documentos da oportunidade e da empresa");
check(api.includes("/investment-contract/download"), "rota de contrato corresponde ao Backend");
check(api.includes("headers['Authorization'] = `Bearer ${token}`"), "multipart usa token existente");
check(api.includes("method: 'DELETE'"), "DELETE usa a rota oficial");

console.log(`opportunity-documents: ${count} assertions passed`);
