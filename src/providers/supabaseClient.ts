import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseClient } from ".";

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log environment status
console.log("Supabase URL:", SUPABASE_URL ? "✅ Present" : "❌ Missing");
console.log(
  "Supabase Anon Key:",
  SUPABASE_ANON_KEY ? "✅ Present" : "❌ Missing",
);

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const error =
    "Missing Supabase environment variables. Please check your .env file.";
  console.error("❌", error);
  throw new Error(error);
}

// Database types
type Tables = {
  users: {
    Row: {
      id: string;
      email: string;
      isCompany: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Insert: {
      id?: string;
      email: string;
      isCompany: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      email?: string;
      isCompany?: boolean;
      created_at?: string;
      updated_at?: string;
    };
  };
  rental_requests: {
    Row: {
      id: string;
      user_id: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      status: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
};

export type Database = {
  public: {
    Tables: Tables;
  };
};

// Create and export the Supabase client
const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

// Test the connection when the module loads
(async () => {
  try {
    console.log("🔌 Testing Supabase connection...");
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      console.error("❌ Supabase connection test failed:", error);
    } else {
      console.log("✅ Supabase connected successfully!");
    }
  } catch (error) {
    console.error("❌ Error testing Supabase connection:", error);
  }
})();

export { supabase };

// This is a clean implementation of the Supabase client with proper TypeScript types and error handling.
