'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Chip, Input, Link, Modal, Tag } from '@ds';
import {
  CONTRACT_TYPE_LABELS,
  type ContractTypeValue,
  type OfferData,
  OfferForm,
  REMOTE_TYPE_LABELS,
  type RemoteTypeValue,
  SENIORITY_LABELS,
  type SeniorityValue,
  STATUS_CHIP_VARIANT,
  STATUS_LABELS,
  type TagOption,
} from './offer/OfferForm';

const CONTRACT_TYPE_VALUES = Object.keys(
  CONTRACT_TYPE_LABELS,
) as ContractTypeValue[];
const REMOTE_TYPE_VALUES = Object.keys(REMOTE_TYPE_LABELS) as RemoteTypeValue[];
const SENIORITY_VALUES = Object.keys(SENIORITY_LABELS) as SeniorityValue[];

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

  const selectedTagIds = new Set(searchParams.getAll('tagIds'));
  const selectedContractTypes = new Set(searchParams.getAll('contractType'));
  const selectedSeniority = new Set(searchParams.getAll('seniority'));
  const selectedRemoteType = new Set(searchParams.getAll('remoteType'));
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';

  const [searchText, setSearchText] = useState(searchParams.get('q') ?? '');

  // Filters/sort live in the URL (like `offer` already does) so the list is
  // shareable/refresh-safe and every facet updates via the same mechanism.
  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.replace(query ? `/app?${query}` : '/app', { scroll: false });
  }

  // Debounce free-text search: only push to the URL once the user stops
  // typing, so every keystroke doesn't trigger a server re-fetch.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally
  // debounced on searchText alone - including searchParams/updateParams
  // would reset the timer on every URL change and defeat the debounce.
  useEffect(() => {
    const trimmed = searchText.trim();
    if (trimmed === (searchParams.get('q') ?? '')) {
      return;
    }
    const timeout = setTimeout(() => {
      updateParams((params) => {
        if (trimmed) {
          params.set('q', trimmed);
        } else {
          params.delete('q');
        }
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  function toggleMultiParam(key: string, value: string, selected: Set<string>) {
    updateParams((params) => {
      const next = new Set(selected);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      params.delete(key);
      for (const item of next) {
        params.append(key, item);
      }
    });
  }

  function setSort(value: 'newest' | 'oldest') {
    updateParams((params) => {
      if (value === 'newest') {
        params.delete('sort');
      } else {
        params.set('sort', value);
      }
    });
  }

  function openCreate() {
    updateParams((params) => params.set('offer', 'new'));
  }

  function close() {
    updateParams((params) => params.delete('offer'));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your job offers</h2>
        <Button type="button" size="sm" onClick={openCreate}>
          Add offer
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-base-300 border-b pb-4">
        <div className="flex items-end gap-2">
          <Input
            type="text"
            label="Search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-full"
            placeholder="Search title, notes, company, location…"
          />
          <label className="d-fieldset-label flex flex-col items-start gap-1">
            Sort
            <select
              className="d-select"
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as 'newest' | 'oldest')
              }
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral text-xs">Tags:</span>
            {tags.map((tag) => (
              <Tag
                key={tag.id}
                name={tag.name}
                value={tag.id}
                checked={selectedTagIds.has(tag.id)}
                onCheckedChange={() =>
                  toggleMultiParam('tagIds', tag.id, selectedTagIds)
                }
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral text-xs">Contract type:</span>
          {CONTRACT_TYPE_VALUES.map((value) => (
            <Tag
              key={value}
              name={CONTRACT_TYPE_LABELS[value]}
              value={value}
              checked={selectedContractTypes.has(value)}
              onCheckedChange={() =>
                toggleMultiParam('contractType', value, selectedContractTypes)
              }
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral text-xs">Seniority:</span>
          {SENIORITY_VALUES.map((value) => (
            <Tag
              key={value}
              name={SENIORITY_LABELS[value]}
              value={value}
              checked={selectedSeniority.has(value)}
              onCheckedChange={() =>
                toggleMultiParam('seniority', value, selectedSeniority)
              }
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral text-xs">Remote type:</span>
          {REMOTE_TYPE_VALUES.map((value) => (
            <Tag
              key={value}
              name={REMOTE_TYPE_LABELS[value]}
              value={value}
              checked={selectedRemoteType.has(value)}
              onCheckedChange={() =>
                toggleMultiParam('remoteType', value, selectedRemoteType)
              }
            />
          ))}
        </div>
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
