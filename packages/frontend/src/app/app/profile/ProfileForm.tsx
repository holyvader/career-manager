'use client';

import { useActionState, useState } from 'react';
import { Button, Input } from '@ds';
import { type ProfileFormState, updateProfileAction } from './actions';

interface LinkRow {
  id: string;
  label: string;
  url: string;
}

interface ProfileFormProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  resumeLink: string | null;
  links: Array<{ label: string; url: string }>;
}

const initialState: ProfileFormState = { error: null, success: false };

export function ProfileForm({
  email,
  firstName,
  lastName,
  resumeLink,
  links,
}: ProfileFormProps) {
  const [rows, setRows] = useState<LinkRow[]>(() =>
    links.map((link) => ({ id: crypto.randomUUID(), ...link })),
  );
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: '', url: '' },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function updateRow(id: string, field: 'label' | 'url', value: string) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <Input
        type="email"
        label="Email"
        value={email}
        disabled
        className="w-full"
      />

      <Input
        type="text"
        name="firstName"
        label="First name"
        defaultValue={firstName ?? ''}
        className="w-full"
      />

      <Input
        type="text"
        name="lastName"
        label="Last name"
        defaultValue={lastName ?? ''}
        className="w-full"
      />

      <Input
        type="url"
        name="resumeLink"
        label="Resume link"
        defaultValue={resumeLink ?? ''}
        className="w-full"
        placeholder="https://example.com/resume.pdf"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Other links (portfolio, LinkedIn, GitHub, etc.)
        </span>
        {rows.map((row) => (
          <div key={row.id} className="flex gap-2">
            <Input
              type="text"
              name="linkLabel"
              value={row.label}
              onChange={(event) =>
                updateRow(row.id, 'label', event.target.value)
              }
              placeholder="LinkedIn"
              size="sm"
              className="w-1/3"
            />
            <Input
              type="url"
              name="linkUrl"
              value={row.url}
              onChange={(event) => updateRow(row.id, 'url', event.target.value)}
              placeholder="https://linkedin.com/in/example"
              size="sm"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeRow(row.id)}
              aria-label="Remove link"
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" onClick={addRow} className="self-start">
          + Add link
        </Button>
      </div>

      {state.error && (
        <div role="alert" className="d-alert d-alert-error text-sm">
          <span>{state.error}</span>
        </div>
      )}
      {state.success && (
        <div role="alert" className="d-alert d-alert-success text-sm">
          <span>Profile updated.</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
