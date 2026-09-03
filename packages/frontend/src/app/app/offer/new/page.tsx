import { Suspense } from 'react';
import { edenServer } from '@/lib/eden-server';
import { SessionGate } from '../../SessionGate';
import { OfferForm } from '../OfferForm';

async function NewOfferContent() {
  const { data: tags } = await edenServer.tags.get();

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-lg font-semibold">Add job offer</h2>
      <OfferForm mode="create" tags={tags ?? []} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<span className="d-loading d-loading-spinner" />}>
      <SessionGate>
        <NewOfferContent />
      </SessionGate>
    </Suspense>
  );
}
