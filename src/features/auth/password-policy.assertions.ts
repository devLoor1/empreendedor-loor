import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getPasswordPolicyError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_COPY,
} from "./password-policy.ts";

const pageSource = readFileSync(
  new URL("../../pages/change-password.tsx", import.meta.url),
  "utf8",
);
let count = 0;

function check(condition: unknown, message: string) {
  assert.ok(condition, message);
  count += 1;
}

check(PASSWORD_MIN_LENGTH === 8, "usa o mínimo efetivo do Backend");
check(PASSWORD_MAX_LENGTH === 60, "usa o máximo do validator de troca de senha");
check(getPasswordPolicyError("abcde1!x") === null, "aceita senha válida no limite mínimo");
check(
  getPasswordPolicyError(`${"a".repeat(58)}1!`) === null,
  "aceita senha válida no limite máximo",
);
check(getPasswordPolicyError("abcd1!") !== null, "rejeita senha curta");
check(getPasswordPolicyError(`${"a".repeat(59)}1!`) !== null, "rejeita senha longa");
check(getPasswordPolicyError("ABCDEFG1!") !== null, "exige letra minúscula");
check(getPasswordPolicyError("abcdefgh!") !== null, "exige número");
check(getPasswordPolicyError("abcdefgh1") !== null, "exige caractere especial permitido");
check(
  ["\n", "\r", "\u2028", "\u2029"].every(
    (lineTerminator) => getPasswordPolicyError(`abcde1!${lineTerminator}`) !== null,
  ),
  "rejeita os terminadores de linha que o ponto da regex Backend não aceita",
);
check(
  getPasswordPolicyError("abcde1çx") === null,
  "aceita caractere especial ç previsto no Backend",
);
check(
  pageSource.includes("getPasswordPolicyError(form.password)"),
  "a submissão aplica a política compartilhada",
);
check(
  pageSource.includes("{PASSWORD_REQUIREMENTS_COPY}"),
  "a tela renderiza a cópia da política vigente",
);
check(PASSWORD_REQUIREMENTS_COPY.includes("8 a 60"), "a cópia informa os limites efetivos");
check(!pageSource.includes("Mín. 6 caracteres"), "a tela não anuncia mais o mínimo antigo");

console.log(`password-policy: ${count} assertions passed`);
