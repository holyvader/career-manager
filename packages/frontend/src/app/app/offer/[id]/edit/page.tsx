import { Suspense } from 'react';
import { Link } from '@ds';
import { OfferEdit } from '@/app/app/offer/[id]/OfferEdit';
import { SessionGate } from '@/app/app/SessionGate';

interface OfferDetailProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: OfferDetailProps) {
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/app">Back to offers</Link>
      <Suspense fallback={<span className="d-loading d-loading-spinner" />}>
        <SessionGate>
          <OfferEdit params={params} />
        </SessionGate>
      </Suspense>
    </div>
  );
}
