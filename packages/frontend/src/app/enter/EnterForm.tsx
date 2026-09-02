'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { edenClient } from '@/lib/eden-client';

type Mode = 'login' | 'register';

interface FormState {
  error: string | null;
  registered: boolean;
}

const initialState: FormState = { error: null, registered: false };

export function EnterForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');

      if (mode === 'login') {
        const { error } = await edenClient.auth.signIn.post({
          email,
          password,
        });
        if (error) {
          return {
            error:
              error.value?.message ?? 'Something went wrong. Please try again.',
            registered: false,
          };
        }
        router.push('/app');
        return initialState;
      }

      const { error } = await edenClient.auth.signUp.post({
        email,
        password,
        name: String(formData.get('name') ?? ''),
        callbackURL: `${window.location.origin}/verify-email`,
      });

      if (error) {
        return {
          error:
            error.value?.message ?? 'Something went wrong. Please try again.',
          registered: false,
        };
      }

      return { error: null, registered: true };
    },
    initialState,
  );

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="d-card w-full max-w-sm bg-base-100 shadow-sm">
        <div className="d-card-body">
          <div className="d-tabs d-tabs-box mb-4 self-center">
            <button
              type="button"
              className={`d-tab ${mode === 'login' ? 'd-tab-active' : ''}`}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className={`d-tab ${mode === 'register' ? 'd-tab-active' : ''}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          {mode === 'register' && state.registered ? (
            <div role="alert" className="d-alert d-alert-success text-sm">
              <span>
                Check your email for a link to verify your account before
                logging in.
              </span>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-3">
              {mode === 'register' && (
                <label className="d-fieldset-label flex flex-col items-start gap-1">
                  Name
                  <input
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    className="d-input w-full"
                    placeholder="Jane Doe"
                  />
                </label>
              )}

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

              <label className="d-fieldset-label flex flex-col items-start gap-1">
                Password
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  className="d-input w-full"
                  placeholder="••••••••"
                />
              </label>

              {mode === 'login' && (
                <Link
                  href="/forgot-password"
                  className="self-end text-xs text-neutral"
                >
                  Forgot password?
                </Link>
              )}

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
                {pending
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
