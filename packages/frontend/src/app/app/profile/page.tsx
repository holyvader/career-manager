import { Suspense } from 'react';
import { Loader } from '@ds';
import { edenServer } from '@/lib/eden-server';
import { SessionGate } from '../SessionGate';
import { ProfileForm } from './ProfileForm';

interface ProfileLink {
  label: string;
  url: string;
}

function parseLinks(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (link): link is ProfileLink =>
      typeof link === 'object' &&
      link !== null &&
      typeof (link as ProfileLink).label === 'string' &&
      typeof (link as ProfileLink).url === 'string',
  );
}

async function SettingsContent() {
  const { data: user } = await edenServer.me.get();

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Profile</h2>
      <ProfileForm
        email={user.email}
        firstName={user.first_name}
        lastName={user.last_name}
        resumeLink={user.resume_link}
        links={parseLinks(user.links)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <SessionGate>
        <SettingsContent />
      </SessionGate>
    </Suspense>
  );
}
