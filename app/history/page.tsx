import SubmissionsList from "@/components/SubmissionsList";

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <SubmissionsList />
      </div>
    </div>
  );
}
