/**
 * Edge-safe admin check: only env vars, no Prisma/auth.
 * Used by middleware so it doesn't pull in Node-only deps (jackson, etc.)
 */

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
  : null;

/** On self-hosted (no NEXT_PUBLIC_IS_DUB), is this email in ADMIN_EMAILS? */
export const isAdminByEnvEmail = (email: string | undefined): boolean => {
  if (
    !process.env.NEXT_PUBLIC_IS_DUB &&
    ADMIN_EMAILS?.length &&
    email?.toLowerCase()
  ) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }
  return false;
};
