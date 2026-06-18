const SECRET_PATTERNS: RegExp[] = [
  /\.env/i,
  /private\s*key/i,
  /wallet\s*key/i,
  /seed\s*phrase/i,
  /mnemonic/i,
  /api\s*key/i,
  /access\s*token/i,
  /auth\s*token/i,
  /bearer\s+token/i,
  /password/i,
  /ssh\s*key/i,
  /cookie/i,
  /session/i,
  /credential/i,
  /gmail/i,
  /database\s*dump/i,
];

export function findSecretPatternMatches(values: string[]): string[] {
  const matches = new Set<string>();

  for (const value of values) {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value)) {
        matches.add(value);
        break;
      }
    }
  }

  return [...matches];
}
