import Hero from "../components/Hero";
import Features from "../components/Features";
import LearningAnalytics from "../components/LearningAnalytics";
import SubmissionsList from "../components/SubmissionsList";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Learning analytics
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            AI Tutor Analytics
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Submit answers, get AI feedback, and review your history.
          </p>
        </header>

        <div className="flex flex-col gap-10 sm:gap-12">
          <Hero />
          <Features />

          <section
            aria-labelledby="analytics-section-title"
            className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm sm:p-6"
          >
            <header className="border-b border-border pb-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Progress
              </p>
              <h2
                id="analytics-section-title"
                className="mt-1 text-lg font-semibold tracking-tight text-foreground"
              >
                Analytics dashboard
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Updates automatically right after you submit — no refresh needed.
              </p>
            </header>
            <div className="pt-5">
              <LearningAnalytics embedded />
            </div>
          </section>

          <div className="rounded-2xl border border-border bg-card/30 p-5 shadow-sm sm:p-6">
            <SubmissionsList />
          </div>
        </div>
      </div>
    </main>
  );
}
