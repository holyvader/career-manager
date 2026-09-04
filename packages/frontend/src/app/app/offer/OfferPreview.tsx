'use client';

import { Chip } from '@ds';
import {
  CONTRACT_TYPE_LABELS,
  type OfferData,
  REMOTE_TYPE_LABELS,
  SENIORITY_LABELS,
  STATUS_CHIP_VARIANT,
  STATUS_LABELS,
} from '@/app/app/offer/OfferForm';

interface OfferFormProps {
  offer: OfferData;
}

export function OfferPreview({ offer }: OfferFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="d-fieldset-label flex flex-col items-start gap-1">
        {offer?.title}
      </h1>
      <h1 className="d-fieldset-label flex flex-col items-start gap-1">
        {offer?.url ?? ''}
      </h1>
      Status:{' '}
      {offer?.status && (
        <Chip variant={STATUS_CHIP_VARIANT[offer.status]}>
          {STATUS_LABELS[offer.status]}
        </Chip>
      )}
      <div className="flex flex-col gap-1 text-sm">
        {offer.companyName && <span>Company: {offer.companyName}</span>}
        {offer.location && <span>Location: {offer.location}</span>}
        {offer.remoteType && (
          <span>Remote type: {REMOTE_TYPE_LABELS[offer.remoteType]}</span>
        )}
        {offer.seniority && (
          <span>Seniority: {SENIORITY_LABELS[offer.seniority]}</span>
        )}
        {offer.rate && <span>Rate: {offer.rate}</span>}
        {offer.availability && (
          <span>Availability: {offer.availability}</span>
        )}
        {offer.contractType.length > 0 && (
          <span>
            Contract type:{' '}
            {offer.contractType
              .map((type) => CONTRACT_TYPE_LABELS[type])
              .join(', ')}
          </span>
        )}
      </div>
      <pre>{offer?.content ?? ''}</pre>
      <pre>{offer.tags.map((it) => it.name).join(', ')}</pre>
    </div>
  );
}
