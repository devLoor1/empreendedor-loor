export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 60;
export const PASSWORD_SPECIAL_CHARACTERS = "#@$!%*?&.ç;";
export const PASSWORD_REQUIREMENTS_COPY =
  "Use de 8 a 60 caracteres, com letra minúscula, número e um caractere especial (#@$!%*?&.ç;).";

const LOWERCASE_PATTERN = /[a-z]/;
const NUMBER_PATTERN = /\d/;
const SPECIAL_CHARACTER_PATTERN = /[#@$!%*?&.ç;]/;
const LINE_TERMINATOR_PATTERN = /[\n\r\u2028\u2029]/;

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return "A senha deve ter de 8 a 60 caracteres";
  }

  if (LINE_TERMINATOR_PATTERN.test(password)) {
    return "A senha não pode conter quebras de linha";
  }

  if (!LOWERCASE_PATTERN.test(password)) {
    return "A senha deve conter ao menos uma letra minúscula";
  }

  if (!NUMBER_PATTERN.test(password)) {
    return "A senha deve conter ao menos um número";
  }

  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return "A senha deve conter ao menos um caractere especial (#@$!%*?&.ç;)";
  }

  return null;
}
