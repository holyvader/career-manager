'use client';

import { Button, Input, Link } from '@ds';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { edenClient } from '@/lib/eden-client';

interface FormState {
  error: string | null;
}

const initialState: FormState = { error: null };

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const newPassword = String(formData.get('password') ?? '');

      const { error } = await edenClient.auth.resetPassword.post({
        newPassword,
        token,
      });

      if (error) {
        return {
          error:
            error.value?.message ?? 'Something went wrong. Please try again.',
        };
      }

      router.push('/enter');
      return initialState;
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        type="password"
        name="password"
        label="New password"
        required
        minLength={8}
        autoComplete="new-password"
        className="w-full"
        placeholder="••••••••"
      />

      {state.error && (
        <div role="alert" className="d-alert d-alert-error text-sm">
          <span>{state.error}</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? 'Please wait…' : 'Set new password'}
      </Button>

      <Link href="/enter" className="text-xs text-neutral">
        Back to log in
      </Link>
    </form>
  );
}
