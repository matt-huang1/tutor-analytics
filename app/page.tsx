export default function Home() {
  return (
    <main className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h1 className="text-4xl font-bold">
          AI Tutor Analytics
        </h1>

        <p className="mt-4 text-gray-600">
          My first full-stack AI project built with Next.js,
          Tailwind, Supabase, and OpenAI.
        </p>

        <button className="mt-6 px-4 py-2 bg-black text-white rounded-lg">
          Get Started
        </button>
      </div>
    </main>
  );
}