
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const SUPABASE_URL = "https://pjbgfvztqdosbmaevqyf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqYmdmdnp0cWRvc2JtYWV2cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDgzNzcsImV4cCI6MjA1ODU4NDM3N30.VwfglB2OjRocOA_jH7SrHYLlzKS1-0bozR-_GDchUaQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    storage: localStorage,
    autoRefreshToken: true,
  }
});
