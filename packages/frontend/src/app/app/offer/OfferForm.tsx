'use client';

import { type FormEvent, useActionState, useState } from 'react';
import { Button, type ChipVariant, Input, Loader, Tag } from '@ds';
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

export interface OfferData {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  status: 'STARTED' | 'IN_PROGRESS' | 'HIRED' | 'CANCELED';
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
  CANCELED: 'Canceled',
};

export const STATUS_CHIP_VARIANT: Record<OfferData['status'], ChipVariant> = {
  STARTED: 'neutral',
  IN_PROGRESS: 'info',
  HIRED: 'success',
  CANCELED: 'error',
};

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
    if (result.title) {
      setTitle(result.title);
    }
    if (result.content) {
      setContent(result.content);
    }
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
            variant="plain"
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
          Notes
          <textarea
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="d-textarea w-full"
            rows={4}
          />
        </label>

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
        <Button type="submit" variant="plain" size="sm">
          Add tag
        </Button>
      </form>
      {tagError && (
        <div role="alert" className="d-alert d-alert-error text-sm">
          <span>{tagError}</span>
        </div>
      )}
    </div>
  );
}
