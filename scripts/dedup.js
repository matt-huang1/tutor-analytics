// Removes duplicate submissions, keeping the most recent row per (question, answer) pair.
// Run with: node scripts/dedup.js
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://pkeinkyatfrawofijmzs.supabase.co";
const SUPABASE_KEY = "sb_publishable_eKu9hA7LfGKxivFUVYruLg_Bxk9V5vz";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: rows, error } = await supabase
    .from("submissions")
    .select("id, question, answer, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  // Group by (question, answer). First entry in each group is the most recent (desc order).
  const seen = new Map();
  const toDelete = [];

  for (const row of rows) {
    const key = `${row.question}|||${row.answer}`;
    if (seen.has(key)) {
      toDelete.push(row.id);
    } else {
      seen.set(key, row.id);
    }
  }

  if (toDelete.length === 0) {
    console.log(`No duplicates found. ${rows.length} rows are clean.`);
    return;
  }

  console.log(`Found ${toDelete.length} duplicate(s). Deleting…`);

  const { error: deleteError } = await supabase
    .from("submissions")
    .delete()
    .in("id", toDelete);

  if (deleteError) {
    console.error("Delete failed:", deleteError.message);
    process.exit(1);
  }

  console.log(`Done. Removed ${toDelete.length} duplicate row(s). ${rows.length - toDelete.length} remain.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
