'use client';

import { Chip } from '@ds';
import { STATUS_CHIP_VARIANT, STATUS_LABELS } from '@/app/app/offer/OfferForm';

export interface TagOption {
  id: string;
  name: string;
}

export interface OfferData {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  status: 'STARTED' | 'IN_PROGRESS' | 'HIRED' | 'CANCELED';
  tags: TagOption[];
}

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
      <pre>{offer?.content ?? ''}</pre>
      <pre>{offer.tags.map((it) => it.name).join(', ')}</pre>
    </div>
  );
}
