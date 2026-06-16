import { createClient } from "@supabase/supabase-js";

/**
 * Access the lazy-initialized Supabase Client.
 * This ensures that if the environment variables are not yet provided, 
 * the application does not crash on startup, but instead falls back gracefully 
 * to simulated sandbox authentication.
 */
export function getSupabase() {
  // Try to load from Vite public env
  let supabaseUrl = "";
  let supabaseAnonKey = "";

  try {
    supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
    supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
  } catch (e) {
    // Falls back in non-Vite contexts
  }

  // Fallback to process.env if available (such as in server environments)
  if (!supabaseUrl && typeof process !== "undefined" && process.env) {
    supabaseUrl = process.env.SUPABASE_URL || "";
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}
