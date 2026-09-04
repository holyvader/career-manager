'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { edenErrorMessage } from '@/lib/eden-error';
import { edenServer } from '@/lib/eden-server';

export interface OfferFormState {
  error: string | null;
}

const initialState: OfferFormState = { error: null };

const JOB_OFFER_STATUSES = [
  'STARTED',
  'IN_PROGRESS',
  'HIRED',
  'REJECTED',
  'CANCELED',
] as const;
type JobOfferStatus = (typeof JOB_OFFER_STATUSES)[number];

function parseStatus(
  value: FormDataEntryValue | null,
): JobOfferStatus | undefined {
  return (JOB_OFFER_STATUSES as readonly string[]).includes(value as string)
    ? (value as JobOfferStatus)
    : undefined;
}

const CONTRACT_TYPES = [
  'EMPLOYMENT_CONTRACT',
  'B2B',
  'MANDATE_CONTRACT',
  'CONTRACT_FOR_SPECIFIC_WORK',
  'INTERNSHIP',
] as const;
type ContractType = (typeof CONTRACT_TYPES)[number];

const REMOTE_TYPES = ['REMOTE', 'HYBRID', 'ONSITE'] as const;
type RemoteType = (typeof REMOTE_TYPES)[number];

const SENIORITY_LEVELS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD'] as const;
type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

function parseEnum<T extends string>(
  values: readonly T[],
  value: FormDataEntryValue | null,
): T | undefined {
  return (values as readonly string[]).includes(value as string)
    ? (value as T)
    : undefined;
}

function getContractTypes(formData: FormData): ContractType[] {
  return formData
    .getAll('contractType')
    .map(String)
    .filter((value): value is ContractType =>
      (CONTRACT_TYPES as readonly string[]).includes(value),
    );
}

function getTagIds(formData: FormData): string[] {
  return formData.getAll('tagIds').map(String);
}

interface OfferDetailFields {
  companyName: string | undefined;
  location: string | undefined;
  remoteType: RemoteType | undefined;
  seniority: SeniorityLevel | undefined;
  rate: string | undefined;
  availability: string | undefined;
  trackingLink: string | undefined;
  notes: string | undefined;
  contractType: ContractType[];
}

function getOfferDetailFields(formData: FormData): OfferDetailFields {
  return {
    companyName: String(formData.get('companyName') ?? '') || undefined,
    location: String(formData.get('location') ?? '') || undefined,
    remoteType: parseEnum(REMOTE_TYPES, formData.get('remoteType')),
    seniority: parseEnum(SENIORITY_LEVELS, formData.get('seniority')),
    rate: String(formData.get('rate') ?? '') || undefined,
    availability: String(formData.get('availability') ?? '') || undefined,
    trackingLink: String(formData.get('trackingLink') ?? '') || undefined,
    notes: String(formData.get('notes') ?? '') || undefined,
    contractType: getContractTypes(formData),
  };
}

async function reconcileTags(
  offerId: string,
  originalTagIds: string[],
  nextTagIds: string[],
) {
  const toConnect = nextTagIds.filter((id) => !originalTagIds.includes(id));
  const toDisconnect = originalTagIds.filter((id) => !nextTagIds.includes(id));

  await Promise.all([
    ...toConnect.map((tagId) =>
      edenServer.tag.connect.post({ tagId, jobOffers: [offerId] }),
    ),
    ...toDisconnect.map((tagId) =>
      edenServer.tag.disconnect.post({ tagId, jobOffers: [offerId] }),
    ),
  ]);
}

export async function createOfferAction(
  _prevState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const title = String(formData.get('title') ?? '');
  const url = String(formData.get('url') ?? '') || undefined;
  const content = String(formData.get('content') ?? '') || undefined;

  const { data: offer, error } = await edenServer.me.offers.post({
    title,
    url,
    content,
    ...getOfferDetailFields(formData),
  });
  if (error || !offer) {
    return { error: edenErrorMessage(error?.value, 'Failed to create offer') };
  }

  const tagIds = getTagIds(formData);
  if (tagIds.length) {
    await reconcileTags(offer.id, [], tagIds);
  }

  revalidatePath('/app');
  redirect(`/app/offer/${offer.id}`);
}

export async function updateOfferAction(
  offerId: string,
  originalTagIds: string[],
  _prevState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const title = String(formData.get('title') ?? '');
  const url = String(formData.get('url') ?? '') || undefined;
  const content = String(formData.get('content') ?? '') || undefined;
  const status = parseStatus(formData.get('status'));

  const { error } = await edenServer.me.offers({ id: offerId }).patch({
    title,
    url,
    content,
    status,
    ...getOfferDetailFields(formData),
  });
  if (error) {
    return { error: edenErrorMessage(error.value, 'Failed to update offer') };
  }

  await reconcileTags(offerId, originalTagIds, getTagIds(formData));

  revalidatePath('/app');
  revalidatePath(`/app/offer/${offerId}`);
  redirect(`/app/offer/${offerId}`);
}

export async function createTagAction(name: string) {
  const { data, error } = await edenServer.tags.post({ name });
  if (error || !data) {
    return {
      tag: null,
      error: edenErrorMessage(error?.value, 'Failed to create tag'),
    };
  }
  return { tag: { id: data.id, name: data.name }, error: null };
}

export async function deleteTagAction(id: string) {
  const { error } = await edenServer.tag({ id }).delete();
  return { ok: !error };
}

export async function fetchOfferContentAction(url: string) {
  const { data, error } = await edenServer.offers.import.post({ url });
  if (error || !data) {
    return {
      title: null,
      content: null,
      error: edenErrorMessage(error?.value, 'Failed to fetch offer details'),
    };
  }
  return { title: data.title, content: data.content, error: null };
}
