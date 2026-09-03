import { Link } from '@ds';

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Career Manager
        </h1>
        <p className="text-lg leading-8 text-base-content/70">
          Keep track of your entire job search in one place - applications,
          interviews, and offers - so you always know where things stand and
          what to do next.
        </p>
        <Link href="/enter" variant="primary" size="lg">
          Get started
        </Link>
      </main>
    </div>
  );
}
