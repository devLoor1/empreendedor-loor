import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validateUploadFile } from "../../utils/upload-validation.ts";

const DOCUMENT_MAX_SIZE_BYTES = 20 * 1024 * 1024;
const pageSource = readFileSync(new URL("../../pages/documentos.tsx", import.meta.url), "utf8");
const options = {
  allowedExtensions: ["pdf", "png", "jpg", "jpeg", "docx", "xlsx"],
  maxSizeBytes: DOCUMENT_MAX_SIZE_BYTES,
  maxSizeMessage: "O arquivo deve ter até 20 MB.",
};
let count = 0;

function check(condition: unknown, message: string) {
  assert.ok(condition, message);
  count += 1;
}

const exactLimit = validateUploadFile(
  { name: "contrato-social.pdf", size: DOCUMENT_MAX_SIZE_BYTES } as File,
  options,
);
const oneByteOver = validateUploadFile(
  { name: "contrato-social.pdf", size: DOCUMENT_MAX_SIZE_BYTES + 1 } as File,
  options,
);

check(DOCUMENT_MAX_SIZE_BYTES === 20_971_520, "20 MiB corresponde a 20.971.520 bytes");
check(exactLimit.file !== null && exactLimit.error === null, "aceita arquivo no limite exato");
check(oneByteOver.file === null, "rejeita arquivo um byte acima do limite");
check(oneByteOver.error === options.maxSizeMessage, "informa o limite de 20 MB ao rejeitar");
check(
  pageSource.includes("const MAX_FILE_SIZE = 20 * 1024 * 1024;"),
  "a tela ativa usa o limite binário de 20 MiB",
);
check((pageSource.match(/até 20 MB/g) ?? []).length === 2, "mensagem de erro e ajuda exibem 20 MB");
check(!pageSource.includes("até 10 MB"), "a tela ativa não mantém a cópia antiga de 10 MB");

console.log(`document-upload: ${count} assertions passed`);
