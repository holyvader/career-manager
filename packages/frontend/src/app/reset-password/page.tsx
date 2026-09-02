import Link from 'next/link';
import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

interface ResetPasswordContentProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

async function ResetPasswordContent({
  searchParams,
}: ResetPasswordContentProps) {
  const { token, error } = await searchParams;

  if (token && !error) {
    return <ResetPasswordForm token={token} />;
  }

  return (
    <>
      <div role="alert" className="d-alert d-alert-error text-sm">
        <span>
          This password reset link is invalid or has expired. Request a new one
          to continue.
        </span>
      </div>
      <Link href="/forgot-password" className="text-xs text-neutral">
        Request a new link
      </Link>
    </>
  );
}

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="d-card w-full max-w-sm bg-base-100 shadow-sm">
        <div className="d-card-body">
          <h2 className="text-lg font-semibold">Reset your password</h2>

          <Suspense fallback={<span className="d-loading d-loading-spinner" />}>
            <ResetPasswordContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
