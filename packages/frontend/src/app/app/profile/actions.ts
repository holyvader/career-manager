'use server';

import { revalidatePath } from 'next/cache';
import { edenErrorMessage } from '@/lib/eden-error';
import { edenServer } from '@/lib/eden-server';

export interface ProfileFormState {
  error: string | null;
  success: boolean;
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const firstName = String(formData.get('firstName') ?? '').trim() || undefined;
  const lastName = String(formData.get('lastName') ?? '').trim() || undefined;
  const resumeLink =
    String(formData.get('resumeLink') ?? '').trim() || undefined;

  const labels = formData.getAll('linkLabel').map(String);
  const urls = formData.getAll('linkUrl').map(String);
  const links = labels
    .map((label, index) => ({
      label: label.trim(),
      url: (urls[index] ?? '').trim(),
    }))
    .filter((link) => link.label && link.url);

  const { error } = await edenServer.me.patch({
    firstName,
    lastName,
    resumeLink,
    links,
  });
  if (error) {
    return {
      error: edenErrorMessage(error.value, 'Failed to update profile'),
      success: false,
    };
  }

  revalidatePath('/app/settings');
  return { error: null, success: true };
}
