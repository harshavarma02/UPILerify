/**
 * UPILerify — Server instrumentation hook.
 *
 * Runs once when the Node.js server boots (next dev / next start).
 * Phase 1 security remediation: fail fast if required secrets are missing.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvironment } = await import('./lib/security/envValidator');
    validateEnvironment();
  }
}