'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type Mode = 'login' | 'register';

interface FormState {
  error: string | null;
}

const initialState: FormState = { error: null };

export function EnterForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');

      const { error } =
        mode === 'login'
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
              email,
              password,
              name: String(formData.get('name') ?? ''),
            });

      if (error) {
        return {
          error: error.message ?? 'Something went wrong. Please try again.',
        };
      }

      router.push('/app');
      return initialState;
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
        </div>
      </div>
    </div>
  );
}
