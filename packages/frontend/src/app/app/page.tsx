import { Suspense } from 'react';
import { Loader } from '@ds';
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
    <Suspense fallback={<Loader />}>
      <SessionGate>
        <OfferListData />
      </SessionGate>
    </Suspense>
  );
}
