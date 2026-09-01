/**
 * UPILerify — Startup Environment Validator
 *
 * SECURITY REMEDIATION (Phase 1 of the hardening plan):
 *  Fails fast at server boot when critical secrets are missing or insecure.
 *  This closes the "hardcoded secret fallback" class of vulnerabilities
 *  (e.g. webhook signatures signed with a publicly-known default key).
 *
 * Called from instrumentation.ts (register()) at Node.js server startup.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Known placeholder / leaked example values that must never be used as secrets. */
const KNOWN_INSECURE_SECRETS = new Set([
  'upilerify_secret_key', // previous hardcoded fallback in webhookDispatcher
  'whsec_your_custom_secret_key_here', // example value from .env.example
  'whsec_your_custom_secret_key',
]);

const PLACEHOLDER_UPI_IDS = new Set(['merchant@upi', 'yourname@upi', 'test@upi']);

/** Minimum recommended entropy length (openssl rand -hex 32 produces 64 chars). */
const MIN_SECRET_LENGTH = 32;

/**
 * Pure check — returns a structured report without throwing.
 * Useful for tests and diagnostics.
 */
export function checkEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- UPILERIFY_API_KEY (required) ---
  const apiKey = process.env.UPILERIFY_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    errors.push(
      'UPILERIFY_API_KEY is not set. All protected API endpoints will refuse to serve. ' +
        'Generate one with: openssl rand -hex 32'
    );
  } else if (apiKey.length < MIN_SECRET_LENGTH) {
    warnings.push(
      `UPILERIFY_API_KEY is shorter than ${MIN_SECRET_LENGTH} characters. ` +
        'Use a high-entropy key: openssl rand -hex 32'
    );
  }

  // --- WEBHOOK_SECRET (required, no default fallback) ---
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret || !webhookSecret.trim()) {
    errors.push(
      'WEBHOOK_SECRET is not set. Webhooks cannot be signed without it (no default fallback is permitted). ' +
        'Generate one with: openssl rand -hex 32'
    );
  } else if (KNOWN_INSECURE_SECRETS.has(webhookSecret)) {
    errors.push(
      'WEBHOOK_SECRET is set to a publicly-known example/default value. ' +
        'This would allow anyone to forge webhook signatures. ' +
        'Generate a real secret with: openssl rand -hex 32'
    );
  } else if (webhookSecret.length < MIN_SECRET_LENGTH) {
    warnings.push(
      `WEBHOOK_SECRET is shorter than ${MIN_SECRET_LENGTH} characters. ` +
        'Use a high-entropy secret: openssl rand -hex 32'
    );
  }

  // --- DEFAULT_UPI_ID (warn if still placeholder) ---
  const upiId = process.env.DEFAULT_UPI_ID;
  if (!upiId || !upiId.trim()) {
    warnings.push(
      'DEFAULT_UPI_ID is not set. Orders will fall back to "merchant@upi" and payments would settle to a non-existent VPA.'
    );
  } else if (PLACEHOLDER_UPI_IDS.has(upiId)) {
    warnings.push(
      `DEFAULT_UPI_ID ("${upiId}") is still a placeholder value. Set it to your real UPI ID before accepting payments.`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates the environment and THROWS on any error, aborting server startup.
 * Warnings are printed but do not block startup.
 */
export function validateEnvironment(): void {
  const result = checkEnvironment();

  for (const warning of result.warnings) {
    console.warn(`[UPILerify][ENV WARNING] ${warning}`);
  }

  if (!result.valid) {
    const details = result.errors.map((e) => `  - ${e}`).join('\n');
    const message =
      `[UPILerify] Refusing to start: required security environment variables are missing or insecure.\n` +
      `${details}\n` +
      `Copy .env.example to .env.local and fill in every value under "SECURITY (REQUIRED)".`;

    console.error(message);
    throw new Error(
      'UPILerify environment validation failed. See server logs for details.'
    );
  }

  console.log('[UPILerify] Environment validation passed.');
}