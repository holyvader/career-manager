import { Suspense } from 'react';
import { Link, Loader } from '@ds';
import { SessionGate } from '../../SessionGate';
import { OfferDetail } from './OfferDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  return (
    <div>
      <Link href="/app">Back to offers</Link>
      <Suspense fallback={<Loader />}>
        <SessionGate>
          <OfferDetail params={params} />
        </SessionGate>
      </Suspense>
    </div>
  );
}
