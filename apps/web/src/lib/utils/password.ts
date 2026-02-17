const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]).{8,}$/;

export const PASSWORD_RULES =
  "Must be 8+ characters with uppercase, lowercase, number, and special character.";

export function validatePassword(password: string): string | null {
  if (!password) return "Please enter a password.";
  if (!PASSWORD_REGEX.test(password)) return PASSWORD_RULES;
  return null;
}
