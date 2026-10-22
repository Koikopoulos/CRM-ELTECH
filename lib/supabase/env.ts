export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Só vale em `npm run dev` com CRM_DEV_BYPASS=1. Em produção nunca libera. */
export const devBypass =
  process.env.NODE_ENV === "development" && process.env.CRM_DEV_BYPASS === "1";
