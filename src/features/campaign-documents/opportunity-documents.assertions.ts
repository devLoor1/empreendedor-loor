import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  opportunityDocumentTypeLabel,
  parseOpportunityDocuments,
  safeOpportunityDocumentUrl,
} from "./opportunity-documents.ts";

let count = 0;
const check = (condition: unknown, message: string) => {
  assert.ok(condition, message);
  count += 1;
};

const documents = parseOpportunityDocuments({
  data: [
    { id: 12, name: "Contrato", type: "investment_contract", download_link: "" },
    {
      id: 13,
      name: "Balanço",
      type: "financial_statements",
      download_link: "https://files.example.test/13",
    },
    { id: 0, name: "Inválido", type: "other_documents", download_link: "" },
    { id: 14, name: "Sem URL", type: "other_documents" },
  ],
});
check(documents.length === 2, "lista aceita somente documentos tipados com IDs positivos");
check(documents[0].type === "investment_contract", "contrato é preservado mesmo sem link direto");
check(
  parseOpportunityDocuments({ data: null }).length === 0,
  "estado vazio não fabrica documentos",
);
check(
  opportunityDocumentTypeLabel("financial_statements") === "Demonstrações financeiras",
  "tipo conhecido possui label",
);
check(
  opportunityDocumentTypeLabel("unknown") === "Documento da oportunidade",
  "tipo futuro tem fallback seguro",
);
check(
  safeOpportunityDocumentUrl("https://files.example.test/13") !== null,
  "link HTTPS é permitido",
);
check(
  safeOpportunityDocumentUrl("javascript:alert(1)") === null,
  "protocolo executável não vira link",
);
check(safeOpportunityDocumentUrl("/relative") === null, "link relativo sem origem não é assumido");

const detail = readFileSync(new URL("../../pages/campanha-detalhe.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../../services/api.ts", import.meta.url), "utf8");
check(
  detail.includes("getOpportunityDocuments(opportunityId)"),
  "tab lista os documentos reais da oportunidade",
);
check(
  detail.includes("downloadOpportunityInvestmentContract(opportunityId, document.id)"),
  "contrato usa download autenticado",
);
check(api.includes("/investment-contract/download"), "rota de preview corresponde ao Backend");
check(
  api.includes("headers.Authorization = `Bearer ${token}`"),
  "download de contrato usa token existente",
);
check(
  !detail.includes("uploadOpportunityDocument") && !detail.includes("replaceOpportunityDocument"),
  "UI não simula escrita sem contrato",
);

console.log(`opportunity-documents: ${count} assertions passed`);
