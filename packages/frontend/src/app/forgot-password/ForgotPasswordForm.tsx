'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { edenClient } from '@/lib/eden-client';

interface FormState {
  error: string | null;
  submitted: boolean;
}

const initialState: FormState = { error: null, submitted: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const email = String(formData.get('email') ?? '');

      const { error } = await edenClient.auth.forgotPassword.post({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          error:
            error.value?.message ?? 'Something went wrong. Please try again.',
          submitted: false,
        };
      }

      return { error: null, submitted: true };
    },
    initialState,
  );

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="d-card w-full max-w-sm bg-base-100 shadow-sm">
        <div className="d-card-body">
          <h2 className="text-lg font-semibold">Reset your password</h2>

          {state.submitted ? (
            <div role="alert" className="d-alert d-alert-success text-sm">
              <span>
                If that email exists in our system, check your inbox for a link
                to reset your password.
              </span>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-3">
              <label className="d-fieldset-label flex flex-col items-start gap-1">
                Email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="d-input w-full"
                  placeholder="jane@example.com"
                />
              </label>

              {state.error && (
                <div role="alert" className="d-alert d-alert-error text-sm">
                  <span>{state.error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="d-btn d-btn-primary mt-2"
              >
                {pending ? 'Please wait…' : 'Send reset link'}
              </button>
            </form>
          )}

          <Link href="/enter" className="text-xs text-neutral">
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
