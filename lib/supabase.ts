import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pkeinkyatfrawofijmzs.supabase.co";
const supabaseAnonKey = "sb_publishable_eKu9hA7LfGKxivFUVYruLg_Bxk9V5vz";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);