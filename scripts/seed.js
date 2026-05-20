// Wipes the submissions table and inserts a curated demo dataset.
// Run with: node scripts/seed.js
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const SUPABASE_URL = "https://pkeinkyatfrawofijmzs.supabase.co";
const SUPABASE_KEY = "sb_publishable_eKu9hA7LfGKxivFUVYruLg_Bxk9V5vz";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function daysAgo(n, hour = 10) {
  const d = new Date("2026-05-20T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── DETECTOR DESIGN NOTES ──────────────────────────────────────────────────
//
//  OVERCONFIDENCE   student_confidence="high" AND score<6, needs ≥3 such rows
//                   AND ≥35% of all high-conf rows.
//                   → Rows 2, 5, 6 are high-conf + low-score (3 of 5 = 60%) ✓
//
//  PERSISTENT WEAKNESS  dominant error_type (excl. partial_knowledge) appears
//                   in ≥3 rows that have error_types.
//                   → conceptual_misunderstanding in rows 2,3,5,6,8,10 = 6× ✓
//
//  STAGNATION       topic "Trigonometry", 4 entries sorted by date:
//                   early avg (rows 0,1) = 4.5, recent avg (rows 2,3) = 4.5
//                   diff = 0 ≤ 0.5 → fires ✓
//
//  STRENGTH         topic "Probability", 3 entries, avg = (9+8+9)/3 = 8.67 ≥ 7.5 ✓

const rows = [

  // ── 1 · TRIG · stagnation early #1 ─────────────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(14, 9),
    topic: "Trigonometry",
    subtopic: "SOH-CAH-TOA",
    question: "What do sine, cosine and tangent represent in a right-angled triangle?",
    answer:
      "sin is opposite over hyp, i remmember that one. cos is adjacent over hyp i think. tan is... sin divided by cos maybe? I kind of get the idea but i always mix them up when theres no diagram in front of me",
    score: 5,
    reasoning_quality: 4,
    answer_completeness: 5,
    student_confidence: "medium",
    strengths: ["Correctly recalled sine definition", "Aware of tangent as sin/cos ratio"],
    misconceptions: [],
    missing_concepts: ["Precise cosine definition", "Applying ratios without a diagram"],
    error_types: ["partial_knowledge"],
    suggested_next_step:
      "Write SOH-CAH-TOA five times from memory, then draw a right triangle and label all three sides. Apply each ratio until it's automatic.",
  },

  // ── 2 · ALGEBRA · overconfidence #1 + persistent weakness #1 ───────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(13, 11),
    topic: "Algebra",
    subtopic: "Linear Equations",
    question: "Solve for x: 3x + 7 = 2x − 5",
    answer:
      "ok so i move 2x to the left, giving me 3x + 2x = -5 + 7, so 5x = 2, x = 0.4. pretty confident thats right, been doing these all week",
    score: 3,
    reasoning_quality: 2,
    answer_completeness: 5,
    student_confidence: "high",
    strengths: ["Attempted to collect x terms"],
    misconceptions: [
      "Added 2x to left side instead of subtracting it (sign error on transposition)",
      "Moved constant incorrectly — should subtract 7 from both sides",
    ],
    missing_concepts: ["Inverse operations must be applied to both sides", "Verify by substituting answer back in"],
    error_types: ["conceptual_misunderstanding"],
    suggested_next_step:
      "Subtract 2x from both sides first: x + 7 = −5, then subtract 7: x = −12. Check by substituting: 3(−12)+7 = −29, 2(−12)−5 = −29 ✓. Always verify.",
  },

  // ── 3 · TRIG · stagnation early #2 + persistent weakness #2 ────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(12, 14),
    topic: "Trigonometry",
    subtopic: "Unit Circle",
    question: "What is cos(90°)? Explain why.",
    answer:
      "uhh i think its 1? or maybe 0.5. cos and sin at 90 always confuses me. actually wait i think sin(90)=1 so cos(90) must be 0. yeah going with 0",
    score: 4,
    reasoning_quality: 3,
    answer_completeness: 4,
    student_confidence: "low",
    strengths: ["Eventually arrived at correct answer"],
    misconceptions: ["Initial confusion between sin and cos values at 90°", "No geometric reasoning given"],
    missing_concepts: ["Unit circle: cos = x-coordinate, sin = y-coordinate", "At 90° the point is (0,1) so cos=0 by definition"],
    error_types: ["conceptual_misunderstanding", "guessing"],
    suggested_next_step:
      "Draw the unit circle. Mark the point at 90° as (0, 1). Remember: cos = x-coordinate, sin = y-coordinate. Quiz yourself on 0°, 90°, 180°, 270° until the values are instant.",
  },

  // ── 4 · PROBABILITY · strength #1 ──────────────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(11, 10),
    topic: "Probability",
    subtopic: "Basic Probability",
    question: "A bag has 3 red and 7 blue marbles. What is the probability of picking red?",
    answer:
      "Total marbles = 3+7 = 10. Red = 3. So P(red) = 3/10 = 0.3. Pretty straightforward.",
    score: 9,
    reasoning_quality: 9,
    answer_completeness: 9,
    student_confidence: "high",
    strengths: ["Correct sample space", "Clear stepwise working", "Expressed as fraction and decimal"],
    misconceptions: [],
    missing_concepts: [],
    error_types: [],
    suggested_next_step:
      "Solid. Try non-replacement problems next — e.g. pick two marbles without putting the first back — to practise adjusting the sample space on each pick.",
  },

  // ── 5 · CALCULUS · overconfidence #2 + persistent weakness #3 ───────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(10, 16),
    topic: "Calculus",
    subtopic: "Derivatives",
    question: "Find the derivative of f(x) = x³ + 2x.",
    answer:
      "for x^3 you bring the power down so you get x^2. for 2x the derivative is 2. So f'(x) = x^2 + 2. done loads of these, i'm confident",
    score: 4,
    reasoning_quality: 3,
    answer_completeness: 6,
    student_confidence: "high",
    strengths: ["Correctly differentiated the linear term", "Knows power rule exists"],
    misconceptions: ["Forgot to multiply by the original exponent — power rule is n·x^(n−1) not x^(n−1)"],
    missing_concepts: ["Full power rule: bring down AND multiply", "Answer should be 3x²+2 not x²+2"],
    error_types: ["conceptual_misunderstanding", "calculation_error"],
    suggested_next_step:
      "Power rule: d/dx[x^n] = n·x^(n−1). For x³: bring down 3, reduce power → 3x². For 2x: 1·2·x^0 = 2. Answer: 3x²+2. Redo 5 problems showing the coefficient step explicitly.",
  },

  // ── 6 · LOGIC · overconfidence #3 + persistent weakness #4 ─────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(9, 9),
    topic: "Logic",
    subtopic: "Syllogisms",
    question: "All cats are mammals. Some mammals are pets. Can we conclude all cats are pets?",
    answer:
      "yes because cats → mammals → pets, the logic chains through. so all cats must be pets. definately true",
    score: 2,
    reasoning_quality: 2,
    answer_completeness: 4,
    student_confidence: "high",
    strengths: ["Attempted to trace the logical chain"],
    misconceptions: [
      "'Some mammals are pets' does NOT mean all mammals are pets",
      "Transitive reasoning doesn't apply when the quantifier is 'some'",
    ],
    missing_concepts: ["Difference between universal ('all') and existential ('some') quantifiers", "Validity requires the conclusion to follow necessarily from the premises"],
    error_types: ["conceptual_misunderstanding", "logic_breakdown"],
    suggested_next_step:
      "Draw a Venn diagram: cats inside mammals, pets overlapping only part of mammals. Cats may sit entirely outside pets. 'Some' never licenses a 'all' conclusion.",
  },

  // ── 7 · CRITICAL THINKING · noise (misread) ─────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(8, 13),
    topic: "Critical Thinking",
    subtopic: "Argument Analysis",
    question: "In formal logic, what makes an argument 'valid'?",
    answer:
      "a valid argument is one where the conclusion is true and makes sense. like if someone makes a good point you cant disagree with, thats valid. people use it when they agree with something",
    score: 2,
    reasoning_quality: 2,
    answer_completeness: 3,
    student_confidence: "medium",
    strengths: [],
    misconceptions: [
      "Confused colloquial 'valid' with its formal logic definition",
      "Validity is about argument structure, not truth of the conclusion",
    ],
    missing_concepts: [
      "Formal definition: if premises are true, conclusion must follow necessarily",
      "A valid argument can have a false conclusion if premises are false",
    ],
    error_types: ["misread_question", "conceptual_misunderstanding"],
    suggested_next_step:
      "Look up formal validity: an argument is valid if the conclusion follows necessarily from the premises — regardless of whether premises are actually true. Write one valid and one invalid example.",
  },

  // ── 8 · ALGEBRA · persistent weakness #5 ───────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(7, 11),
    topic: "Algebra",
    subtopic: "Factoring",
    question: "Factorise x² − 9.",
    answer:
      "i think this is (x-3)(x-3) because 3x3=9 and x times x is x^2. so (x-3)^2. that feels right to me",
    score: 3,
    reasoning_quality: 3,
    answer_completeness: 5,
    student_confidence: "medium",
    strengths: ["Recognised the expression involves 3 and x²"],
    misconceptions: [
      "Confused difference of two squares (x−3)(x+3) with perfect square (x−3)²",
      "Didn't consider the sign change on the second bracket",
    ],
    missing_concepts: ["Difference of squares identity: a²−b² = (a−b)(a+b)", "Verify by expanding the brackets"],
    error_types: ["conceptual_misunderstanding"],
    suggested_next_step:
      "Identity: a²−b² = (a−b)(a+b). Here a=x, b=3, so x²−9 = (x−3)(x+3). Verify: expand to get x²+3x−3x−9 = x²−9 ✓. Note this is different from (x−3)² = x²−6x+9.",
  },

  // ── 9 · PROBABILITY · strength #2 ──────────────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(6, 15),
    topic: "Probability",
    subtopic: "Simple Events",
    question: "A fair six-sided die is rolled. What is the probability of getting an even number?",
    answer:
      "even numbers on a die are 2, 4, 6. thats 3 out of 6 total outcomes. P(even) = 3/6 = 1/2.",
    score: 8,
    reasoning_quality: 9,
    answer_completeness: 8,
    student_confidence: "high",
    strengths: ["Correctly listed even outcomes", "Simplified fraction", "Clear reasoning"],
    misconceptions: [],
    missing_concepts: [],
    error_types: [],
    suggested_next_step:
      "Great. Push to compound events: P(even AND getting a head on a coin flip simultaneously). This introduces the multiplication rule for independent events.",
  },

  // ── 10 · TRIG · stagnation recent #1 + persistent weakness #6 ───────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(5, 10),
    topic: "Trigonometry",
    subtopic: "Applying Ratios",
    question: "A right triangle has opposite side = 4, hypotenuse = 5. Find sin(θ) and cos(θ).",
    answer:
      "sin = opp/hyp so thats 4/5. for cos i need the adjacent side. using pythagoras: 5^2 - 4^2 = 25-16 = 9, adjacent = 3. so cos = 3/5. but im not sure wich one is opp and wich is adj sometimes",
    score: 5,
    reasoning_quality: 5,
    answer_completeness: 6,
    student_confidence: "medium",
    strengths: ["Correctly calculated sin(θ)", "Used Pythagoras to find missing side"],
    misconceptions: ["Persistent confusion about which side is opposite vs adjacent"],
    missing_concepts: ["Always label the triangle relative to θ before applying ratios", "Verify using sin²θ + cos²θ = 1"],
    error_types: ["conceptual_misunderstanding", "partial_knowledge"],
    suggested_next_step:
      "Before applying any ratio, label the triangle: identify θ, then label opposite, adjacent, hypotenuse relative to it. Then verify: (4/5)²+(3/5)² = 16/25+9/25 = 1 ✓.",
  },

  // ── 11 · CALCULUS · moderate noise ──────────────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(4, 14),
    topic: "Calculus",
    subtopic: "Integration",
    question: "Find the indefinite integral of 2x with respect to x.",
    answer:
      "you add 1 to the power and devide by the new power. so 2x becomes 2x^2 / 2 = x^2. i think you add +C aswell. so x^2 + C",
    score: 7,
    reasoning_quality: 6,
    answer_completeness: 7,
    student_confidence: "medium",
    strengths: ["Correct application of power rule for integration", "Remembered constant of integration"],
    misconceptions: [],
    missing_concepts: ["Why +C is required (infinitely many antiderivatives)", "Formal integral notation: ∫2x dx"],
    error_types: ["partial_knowledge"],
    suggested_next_step:
      "Mechanics are correct. Now practise writing the full notation: ∫2x dx = x²+C. Be able to explain in one sentence why +C must appear. Then try ∫(3x²−4x+1) dx.",
  },

  // ── 12 · LOGIC · noise (logic breakdown) ────────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(3, 9),
    topic: "Logic",
    subtopic: "Sequences",
    question: "What comes next in the sequence: 2, 4, 8, 16, …?",
    answer:
      "looks like it doubles each time. 2x2=4, 4x2=8, 8x2=16. so next is 16+16=32. oh wait i said doubled but then i added instead. yeah 32 is right though",
    score: 6,
    reasoning_quality: 5,
    answer_completeness: 6,
    student_confidence: "low",
    strengths: ["Correctly identified the doubling pattern"],
    misconceptions: ["Briefly conflated doubling (×2) with adding (16+16), self-corrected"],
    missing_concepts: ["Expressing as geometric sequence: multiply by ratio r=2", "General term: 2^n"],
    error_types: ["logic_breakdown"],
    suggested_next_step:
      "Your pattern-spotting is right. Now express it precisely: 'multiply by 2 each time' — not 'add 16'. Write the next 3 terms (32, 64, 128) and describe the rule as 2 to the power of n.",
  },

  // ── 13 · TRIG · stagnation recent #2 ────────────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(2, 16),
    topic: "Trigonometry",
    subtopic: "Radians and Degrees",
    question: "Convert 45° to radians. Show your working.",
    answer:
      "mulitply by pi/180. so 45 x pi/180 = 45pi/180. simplify: 45 and 180 both divide by 45 so = pi/4. 45 degress = pi/4 radians",
    score: 4,
    reasoning_quality: 5,
    answer_completeness: 5,
    student_confidence: "low",
    strengths: ["Correct conversion formula", "Correct simplification and final answer"],
    misconceptions: ["Simplification step not shown clearly — jumped from 45π/180 to π/4 without writing 45÷45=1, 180÷45=4"],
    missing_concepts: ["Show cancellation explicitly: 45π/180 = π/4 (divide numerator and denominator by 45)", "Why the formula works: proportion of a full 360° circle"],
    error_types: ["partial_knowledge", "calculation_error"],
    suggested_next_step:
      "Your formula and answer are right but show the cancellation step: 45/180 = 1/4, so the result is π/4. Now memorise the five key angles in both degrees and radians.",
  },

  // ── 14 · PROBABILITY · strength #3 ─────────────────────────────────────
  {
    submission_id: randomUUID(),
    created_at: daysAgo(1, 11),
    topic: "Probability",
    subtopic: "Complementary Events",
    question: "P(rain tomorrow) = 0.35. What is the probability it does NOT rain?",
    answer:
      "all probabilities add to 1. so P(no rain) = 1 - 0.35 = 0.65.",
    score: 9,
    reasoning_quality: 9,
    answer_completeness: 9,
    student_confidence: "medium",
    strengths: ["Applied complement rule correctly", "Concise and clear", "No errors"],
    misconceptions: [],
    missing_concepts: [],
    error_types: [],
    suggested_next_step:
      "Perfect. Extend to independent events: if P(rain Mon)=0.35 and P(rain Tue)=0.40 independently, find P(rain both days) and P(no rain either day). This introduces the multiplication rule.",
  },

];

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Step 1 — Clearing submissions table…");
  const { error: deleteError } = await supabase
    .from("submissions")
    .delete()
    .not("id", "is", null);

  if (deleteError) {
    console.error("DELETE FAILED:", deleteError.message);
    process.exit(1);
  }
  console.log("  ✓ Table cleared.\n");

  console.log("Step 2 — Inserting seed rows…");
  const { data, error: insertError } = await supabase
    .from("submissions")
    .insert(rows)
    .select();

  if (insertError) {
    console.error("INSERT FAILED:", insertError.message);
    process.exit(1);
  }
  console.log(`  ✓ Inserted ${data.length} rows.\n`);

  // ── Detector verification ──────────────────────────────────────────────
  const highConf       = rows.filter(r => r.student_confidence === "high");
  const overconfident  = highConf.filter(r => r.score < 6);
  const withErrors     = rows.filter(r => r.error_types.length > 0);
  const cmHits         = rows.filter(r => r.error_types.includes("conceptual_misunderstanding"));
  const trigRows       = rows.filter(r => r.topic === "Trigonometry").sort((a,b) => a.created_at.localeCompare(b.created_at));
  const mid            = Math.ceil(trigRows.length / 2);
  const earlyAvg       = trigRows.slice(0, mid).reduce((s,r) => s + r.score, 0) / mid;
  const recentAvg      = trigRows.slice(mid).reduce((s,r) => s + r.score, 0) / (trigRows.length - mid);
  const probScores     = rows.filter(r => r.topic === "Probability").map(r => r.score);
  const probAvg        = probScores.reduce((a,b) => a+b,0) / probScores.length;

  console.log("── Detector summary ────────────────────────────────────────");
  console.log(`Total rows:         ${rows.length}`);
  console.log(`Overconfidence:     ${overconfident.length}/${highConf.length} high-conf rows score <6 = ${Math.round(overconfident.length/highConf.length*100)}% (threshold 35%) → should FIRE`);
  console.log(`Persistent weakness: conceptual_misunderstanding ×${cmHits.length} in ${withErrors.length} error-tagged rows → should FIRE`);
  console.log(`Stagnation:         Trigonometry ×${trigRows.length} rows | early avg ${earlyAvg.toFixed(1)} → recent avg ${recentAvg.toFixed(1)} (diff ${(recentAvg-earlyAvg).toFixed(1)}, threshold ≤0.5) → should FIRE`);
  console.log(`Strength:           Probability ×${probScores.length} rows | avg ${probAvg.toFixed(2)} (threshold ≥7.5) → should FIRE`);
  console.log("────────────────────────────────────────────────────────────");
}

main().catch(err => { console.error(err); process.exit(1); });
