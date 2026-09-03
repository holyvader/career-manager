import { Suspense } from 'react';
import { Link } from '@ds';

interface VerifyEmailContentProps {
  searchParams: Promise<{ error?: string }>;
}

async function VerifyEmailContent({ searchParams }: VerifyEmailContentProps) {
  const { error } = await searchParams;

  if (error) {
    return (
      <div role="alert" className="d-alert d-alert-error text-sm">
        <span>
          This verification link is invalid or has expired. Log in and request a
          new one.
        </span>
      </div>
    );
  }

  return (
    <div role="alert" className="d-alert d-alert-success text-sm">
      <span>Your email has been verified. You can now log in.</span>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="d-card w-full max-w-sm bg-base-100 shadow-sm">
        <div className="d-card-body">
          <h2 className="text-lg font-semibold">Email verification</h2>

          <Suspense fallback={<span className="d-loading d-loading-spinner" />}>
            <VerifyEmailContent searchParams={searchParams} />
          </Suspense>

          <Link href="/enter" className="text-xs text-neutral">
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
