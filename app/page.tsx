import Hero from "../components/Hero";
import Features from "../components/Features";
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
            Submit answers, get AI feedback, and review your history. Theme
            follows your system appearance.
          </p>
        </header>

        <div className="flex flex-col gap-10 sm:gap-12">
          <Hero />
          <Features />
          <SubmissionsList />
        </div>
      </div>
    </main>
  );
}
