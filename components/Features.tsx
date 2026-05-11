const items = [
  {
    title: "AI feedback",
    body: "Personalised comments on each answer you submit.",
  },
  {
    title: "Weak topics",
    body: "Spot patterns and focus revision where it matters.",
  },
  {
    title: "Revision analytics",
    body: "See how your practice changes over time.",
  },
] as const;

export default function Features() {
  return (
    <section
      aria-labelledby="features-heading"
      className="rounded-2xl border border-border bg-surface-subtle/80 p-6 sm:p-8"
    >
      <h2
        id="features-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        What you get
      </h2>
      <ul className="mt-5 grid gap-6 sm:grid-cols-3 sm:gap-4">
        {items.map(({ title, body }) => (
          <li key={title}>
            <p className="font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
