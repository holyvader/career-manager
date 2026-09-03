import { Suspense } from 'react';
import { edenServer } from '@/lib/eden-server';
import { OfferListClient } from './OfferListClient';
import { SessionGate } from './SessionGate';

async function OfferListData() {
  const [{ data: offers }, { data: tags }] = await Promise.all([
    edenServer.me.offers.get(),
    edenServer.tags.get(),
  ]);

  return <OfferListClient offers={offers ?? []} tags={tags ?? []} />;
}

export default function Page() {
  return (
    <Suspense fallback={<span className="d-loading d-loading-spinner" />}>
      <SessionGate>
        <OfferListData />
      </SessionGate>
    </Suspense>
  );
}
