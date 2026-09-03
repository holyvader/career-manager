'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Chip, Link, Modal } from '@ds';
import {
  type OfferData,
  OfferForm,
  STATUS_CHIP_VARIANT,
  STATUS_LABELS,
  type TagOption,
} from './offer/OfferForm';

interface OfferListClientProps {
  offers: OfferData[];
  tags: TagOption[];
}

export function OfferListClient({ offers, tags }: OfferListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Modal state lives in the URL's query string (not a route segment - no
  // parallel/intercepting routes involved) so a refresh or shared link keeps
  // the modal open on the right offer instead of silently dropping back to
  // just the list.
  const offerParam = searchParams.get('offer');
  const selectedOffer = offerParam
    ? (offers.find((offer) => offer.id === offerParam) ?? null)
    : null;
  const mode: 'create' | 'preview' | null =
    offerParam === 'new' ? 'create' : selectedOffer ? 'preview' : null;

  function openCreate() {
    router.replace('/app?offer=new', { scroll: false });
  }

  function openEdit(offer: OfferData) {
    router.replace(`/app?offer=${offer.id}`, { scroll: false });
  }

  function close() {
    router.replace('/app', { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your job offers</h2>
        <Button type="button" size="sm" onClick={openCreate}>
          Add offer
        </Button>
      </div>

      {offers.length ? (
        <ul className="flex flex-col gap-2">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Link
                href={`/app/offer/${offer.id}`}
                className="d-card w-full bg-base-100 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="d-card-body flex-row items-center justify-between py-3">
                  <span className="font-medium">{offer.title}</span>
                  <Chip variant={STATUS_CHIP_VARIANT[offer.status]}>
                    {STATUS_LABELS[offer.status]}
                  </Chip>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p>You haven't added any job offers yet.</p>
          <Button type="button" onClick={openCreate}>
            Add your first offer
          </Button>
        </div>
      )}

      {mode && (
        <Modal onClose={close}>
          <h2 className="mb-4 text-lg font-semibold">
            {mode === 'create' ? 'Add job offer' : selectedOffer?.title}
          </h2>
          <OfferForm
            key={selectedOffer?.id ?? 'create'}
            mode={mode}
            offer={selectedOffer ?? undefined}
            tags={tags}
          />
        </Modal>
      )}
    </div>
  );
}
