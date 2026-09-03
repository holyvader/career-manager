'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ds';
import { edenClient } from '@/lib/eden-client';
import { edenErrorMessage } from '@/lib/eden-error';

interface RegisterFormState {
  error: string | null;
  registered: boolean;
}

const initialState: RegisterFormState = { error: null, registered: false };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<
    RegisterFormState,
    FormData
  >(async (_prevState, formData) => {
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    const firstName = String(formData.get('firstName') ?? '');
    const lastName = String(formData.get('lastName') ?? '');

    if (password !== confirmPassword) {
      return {
        error: 'Passwords do not match.',
        registered: false,
      };
    }

    const { error } = await edenClient.auth.signUp.post({
      email,
      password,
      firstName,
      lastName,
      callbackURL: `${window.location.origin}/verify-email`,
    });

    if (error) {
      return {
        error: edenErrorMessage(
          error.value,
          'Something went wrong. Please try again.',
        ),
        registered: false,
      };
    }

    return { error: null, registered: true };
  }, initialState);

  if (state.registered) {
    return (
      <div role="alert" className="d-alert d-alert-success text-sm">
        <span>
          Check your email for a link to verify your account before logging in.
        </span>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        type="text"
        name="firstName"
        label="First Name"
        required
        autoComplete="given-name"
        className="w-full"
        placeholder="Jane"
      />
      <Input
        type="text"
        name="lastName"
        label="Name"
        required
        autoComplete="family-name"
        className="w-full"
        placeholder="Doe"
      />

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
        maxLength={128}
        autoComplete="new-password"
        className="w-full"
        placeholder="••••••••"
      />

      <Input
        type="password"
        name="confirmPassword"
        label="Confirm Password"
        required
        maxLength={128}
        minLength={8}
        autoComplete="off"
        className="w-full"
        placeholder="••••••••"
      />

      {state.error && (
        <div role="alert" className="d-alert d-alert-error text-sm">
          <span>{state.error}</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? 'Please wait…' : 'Create account'}
      </Button>
    </form>
  );
}
