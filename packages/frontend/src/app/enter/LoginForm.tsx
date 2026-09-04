'use client';

import { Button, Input, Link } from '@ds';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { edenClient } from '@/lib/eden-client';
import { edenErrorMessage } from '@/lib/eden-error';

interface LoginFormState {
  error: string | null;
}

const initialState: LoginFormState = { error: null };

export function LoginForm() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState<LoginFormState, FormData>(
    async (_prevState, formData) => {
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');

      const { error } = await edenClient.auth.signIn.post({ email, password });
      if (error) {
        return {
          error: edenErrorMessage(
            error.value,
            'Something went wrong. Please try again.',
          ),
        };
      }

      router.push('/app');
      return initialState;
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        type="email"
        name="email"
        label="Email"
        required
        autoComplete="email"
        className="w-full"
        placeholder="jane@example.com"
      />

      <Input
        type="password"
        name="password"
        label="Password"
        required
        minLength={8}
        autoComplete="current-password"
        className="w-full"
        placeholder="••••••••"
      />

      <Link href="/forgot-password" className="self-end text-xs text-neutral">
        Forgot password?
      </Link>

      {state.error && (
        <div role="alert" className="d-alert d-alert-error text-sm">
          <span>{state.error}</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? 'Please wait…' : 'Log in'}
      </Button>
    </form>
  );
}
