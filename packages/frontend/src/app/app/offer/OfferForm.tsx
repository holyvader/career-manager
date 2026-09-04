'use client';

import { type FormEvent, useActionState, useState } from 'react';
import { Button, type ChipVariant, Input, Loader, Modal, Tag } from '@ds';
import {
  createOfferAction,
  createTagAction,
  deleteTagAction,
  fetchOfferContentAction,
  type OfferFormState,
  updateOfferAction,
} from './actions';

export interface TagOption {
  id: string;
  name: string;
}

export type ContractTypeValue =
  | 'EMPLOYMENT_CONTRACT'
  | 'B2B'
  | 'MANDATE_CONTRACT'
  | 'CONTRACT_FOR_SPECIFIC_WORK'
  | 'INTERNSHIP';

export type RemoteTypeValue = 'REMOTE' | 'HYBRID' | 'ONSITE';

export type SeniorityValue = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';

export interface OfferData {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  status: 'STARTED' | 'IN_PROGRESS' | 'HIRED' | 'REJECTED' | 'CANCELED';
  companyName: string | null;
  location: string | null;
  remoteType: RemoteTypeValue | null;
  seniority: SeniorityValue | null;
  rate: string | null;
  availability: string | null;
  trackingLink: string | null;
  notes: string | null;
  contractType: ContractTypeValue[];
  tags: TagOption[];
}

interface OfferFormProps {
  mode: 'create' | 'edit' | 'preview';
  offer?: OfferData;
  tags: TagOption[];
}

export const STATUS_LABELS: Record<OfferData['status'], string> = {
  STARTED: 'Started',
  IN_PROGRESS: 'In progress',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
};

export const STATUS_CHIP_VARIANT: Record<OfferData['status'], ChipVariant> = {
  STARTED: 'neutral',
  IN_PROGRESS: 'info',
  HIRED: 'success',
  REJECTED: 'warning',
  CANCELED: 'error',
};

export const CONTRACT_TYPE_LABELS: Record<ContractTypeValue, string> = {
  EMPLOYMENT_CONTRACT: 'Employment contract',
  B2B: 'B2B',
  MANDATE_CONTRACT: 'Mandate contract',
  CONTRACT_FOR_SPECIFIC_WORK: 'Contract for specific work',
  INTERNSHIP: 'Internship',
};

export const REMOTE_TYPE_LABELS: Record<RemoteTypeValue, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

export const SENIORITY_LABELS: Record<SeniorityValue, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
  LEAD: 'Lead',
};

const CONTRACT_TYPE_VALUES = Object.keys(
  CONTRACT_TYPE_LABELS,
) as ContractTypeValue[];

const initialState: OfferFormState = { error: null };

export function OfferForm({ mode, offer, tags }: OfferFormProps) {
  const [localTags, setLocalTags] = useState<TagOption[]>(tags);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    () => new Set(offer?.tags.map((tag) => tag.id) ?? []),
  );
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  const [title, setTitle] = useState(offer?.title ?? '');
  const [url, setUrl] = useState(offer?.url ?? '');
  const [content, setContent] = useState(offer?.content ?? '');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const [companyName, setCompanyName] = useState(offer?.companyName ?? '');
  const [location, setLocation] = useState(offer?.location ?? '');
  const [rate, setRate] = useState(offer?.rate ?? '');
  const [availability, setAvailability] = useState(offer?.availability ?? '');
  const [trackingLink, setTrackingLink] = useState(offer?.trackingLink ?? '');
  const [notes, setNotes] = useState(offer?.notes ?? '');
  const [selectedContractTypes, setSelectedContractTypes] = useState<
    Set<ContractTypeValue>
  >(() => new Set(offer?.contractType ?? []));

  const action =
    mode === 'edit' && offer
      ? updateOfferAction.bind(
          null,
          offer.id,
          offer.tags.map((tag) => tag.id),
        )
      : createOfferAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  function toggleTag(id: string, checked: boolean) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleContractType(value: ContractTypeValue, checked: boolean) {
    setSelectedContractTypes((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(value);
      } else {
        next.delete(value);
      }
      return next;
    });
  }

  async function handleCreateTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newTagName.trim();
    if (!name) {
      return;
    }
    const result = await createTagAction(name);
    if (!result.tag) {
      setTagError(result.error ?? 'Failed to create tag');
      return;
    }
    setTagError(null);
    setLocalTags((prev) => [...prev, result.tag]);
    setSelectedTagIds((prev) => new Set(prev).add(result.tag.id));
    setNewTagName('');
  }

  async function handleFetchFromUrl() {
    if (!url.trim()) {
      return;
    }
    setIsFetchingUrl(true);
    setFetchError(null);
    const result = await fetchOfferContentAction(url.trim());
    setIsFetchingUrl(false);
    if (result.error) {
      setFetchError(result.error);
      return;
    }
    if (!result.title && !result.content) {
      setFetchError(
        'Could not find any details on that page — fill the form in manually.',
      );
      return;
    }
    setReviewDraft({
      title: result.title ?? title,
      content: result.content ?? content,
    });
  }

  function applyReview() {
    if (!reviewDraft) {
      return;
    }
    setTitle(reviewDraft.title);
    setContent(reviewDraft.content);
    setReviewDraft(null);
  }

  async function handleDeleteTag(id: string) {
    const result = await deleteTagAction(id);
    if (!result.ok) {
      setTagError('Failed to delete tag');
      return;
    }
    setLocalTags((prev) => prev.filter((tag) => tag.id !== id));
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <Input
          type="text"
          name="title"
          label="Title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full"
          placeholder="Frontend Engineer"
        />

        <div className="flex items-end gap-2">
          <Input
            type="url"
            name="url"
            label="URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="w-full"
            placeholder="https://company.example.com/careers/123"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleFetchFromUrl}
            disabled={isFetchingUrl || !url.trim()}
          >
            {isFetchingUrl ? <Loader size="xs" /> : 'Fetch details'}
          </Button>
        </div>

        {fetchError && (
          <div role="alert" className="d-alert d-alert-error text-sm">
            <span>{fetchError}</span>
          </div>
        )}

        <label className="d-fieldset-label flex flex-col items-start gap-1">
          Job description
          <textarea
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="d-textarea w-full"
            rows={4}
          />
        </label>

        <div className="flex gap-2">
          <Input
            type="text"
            name="companyName"
            label="Company"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="w-full"
            placeholder="Acme Inc"
          />
          <Input
            type="text"
            name="location"
            label="Location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full"
            placeholder="Warsaw"
          />
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            name="rate"
            label="Rate"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            className="w-full"
            placeholder="20-25k PLN/mo"
          />
          <Input
            type="text"
            name="availability"
            label="Availability"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            className="w-full"
            placeholder="Immediate"
          />
        </div>

        <Input
          type="url"
          name="trackingLink"
          label="Tracking link"
          value={trackingLink}
          onChange={(event) => setTrackingLink(event.target.value)}
          className="w-full"
          placeholder="https://company.example.com/careers/track/123"
        />

        <div className="flex gap-2">
          <label className="d-fieldset-label flex flex-col items-start gap-1">
            Remote type
            <select
              name="remoteType"
              defaultValue={offer?.remoteType ?? ''}
              className="d-select w-full"
            >
              <option value="">Not specified</option>
              {Object.entries(REMOTE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="d-fieldset-label flex flex-col items-start gap-1">
            Seniority
            <select
              name="seniority"
              defaultValue={offer?.seniority ?? ''}
              className="d-select w-full"
            >
              <option value="">Not specified</option>
              {Object.entries(SENIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Contract type</span>
          <div className="flex flex-wrap gap-2">
            {CONTRACT_TYPE_VALUES.map((value) => (
              <Tag
                key={value}
                name={CONTRACT_TYPE_LABELS[value]}
                value={value}
                inputName="contractType"
                checked={selectedContractTypes.has(value)}
                onCheckedChange={(checked) =>
                  toggleContractType(value, checked)
                }
              />
            ))}
          </div>
        </div>

        {mode === 'edit' && (
          <label className="d-fieldset-label flex flex-col items-start gap-1">
            Status
            <select
              name="status"
              defaultValue={offer?.status}
              className="d-select w-full"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Tags</span>
          <div className="flex flex-wrap gap-2">
            {localTags.map((tag) => (
              <Tag
                key={tag.id}
                name={tag.name}
                value={tag.id}
                checked={selectedTagIds.has(tag.id)}
                onCheckedChange={(checked) => toggleTag(tag.id, checked)}
                onDelete={() => handleDeleteTag(tag.id)}
              />
            ))}
            {!localTags.length && (
              <span className="text-neutral text-sm">No tags yet</span>
            )}
          </div>
        </div>

        <label className="d-fieldset-label flex flex-col items-start gap-1">
          Notes
          <textarea
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="d-textarea w-full"
            rows={4}
            placeholder="Recruiter call scheduled for Thursday..."
          />
        </label>

        {state.error && (
          <div role="alert" className="d-alert d-alert-error text-sm">
            <span>{state.error}</span>
          </div>
        )}

        <Button type="submit" disabled={pending} className="mt-2 self-start">
          {pending ? 'Saving…' : mode === 'create' ? 'Create offer' : 'Save'}
        </Button>
      </form>

      <form
        onSubmit={handleCreateTag}
        className="flex items-end gap-2 border-base-300 border-t pt-4"
      >
        <Input
          type="text"
          label="New tag"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          size="sm"
          placeholder="Remote"
        />
        <Button type="submit" size="sm">
          Add tag
        </Button>
      </form>
      {tagError && (
        <div role="alert" className="d-alert d-alert-error text-sm">
          <span>{tagError}</span>
        </div>
      )}

      {reviewDraft && (
        <Modal onClose={() => setReviewDraft(null)}>
          <h3 className="mb-4 text-lg font-semibold">Review fetched details</h3>
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              label="Title"
              value={reviewDraft.title}
              onChange={(event) =>
                setReviewDraft({ ...reviewDraft, title: event.target.value })
              }
              className="w-full"
            />
            <label className="d-fieldset-label flex flex-col items-start gap-1">
              Job description
              <textarea
                value={reviewDraft.content}
                onChange={(event) =>
                  setReviewDraft({
                    ...reviewDraft,
                    content: event.target.value,
                  })
                }
                className="d-textarea w-full"
                rows={6}
              />
            </label>
            <Button type="button" className="self-start" onClick={applyReview}>
              Apply
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
