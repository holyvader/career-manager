import { Suspense } from 'react';
import { Loader } from '@ds';
import { edenServer } from '@/lib/eden-server';
import type {
  ContractTypeValue,
  RemoteTypeValue,
  SeniorityValue,
} from './offer/OfferForm';
import { OfferListClient } from './OfferListClient';
import { SessionGate } from './SessionGate';

interface OfferListDataProps {
  searchParams: Promise<{
    q?: string;
    tagIds?: string | string[];
    contractType?: string | string[];
    seniority?: string | string[];
    remoteType?: string | string[];
    sort?: string;
  }>;
}

// Elysia's query coercion accepts either a single value or repeated keys at
// runtime, but the eden client's inferred type matches the schema's decoded
// (always-array) shape - wrap bare single values into one-element arrays so
// both call shapes stay valid regardless of how many times a key appears.
function toArray<T extends string>(
  value: string | string[] | undefined,
): T[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return (Array.isArray(value) ? value : [value]) as T[];
}

async function OfferListData({ searchParams }: OfferListDataProps) {
  const { q, tagIds, contractType, seniority, remoteType, sort } =
    await searchParams;
  const [{ data: offers }, { data: tags }] = await Promise.all([
    edenServer.me.offers.get({
      query: {
        q,
        tagIds: toArray(tagIds),
        contractType: toArray<ContractTypeValue>(contractType),
        seniority: toArray<SeniorityValue>(seniority),
        remoteType: toArray<RemoteTypeValue>(remoteType),
        sort: sort === 'oldest' ? 'oldest' : undefined,
      },
    }),
    edenServer.tags.get(),
  ]);

  return <OfferListClient offers={offers ?? []} tags={tags ?? []} />;
}

interface PageProps {
  searchParams: OfferListDataProps['searchParams'];
}

export default function Page({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<Loader />}>
      <SessionGate>
        <OfferListData searchParams={searchParams} />
      </SessionGate>
    </Suspense>
  );
}
