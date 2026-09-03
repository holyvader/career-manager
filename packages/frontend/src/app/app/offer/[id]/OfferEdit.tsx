import { notFound } from 'next/navigation';
import { Link } from '@ds';
import { edenServer } from '@/lib/eden-server';
import { OfferForm } from '../OfferForm';

interface OfferEditProps {
  params: Promise<{ id: string }>;
}

export async function OfferEdit({ params }: OfferEditProps) {
  const { id } = await params;
  const [{ data: offer }, { data: tags }] = await Promise.all([
    edenServer.me.offers({ id }).get(),
    edenServer.tags.get(),
  ]);

  if (!offer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-lg font-semibold">{offer.title}</h2>
      <Link href={`/app/offer/${id}`}>Back to offer</Link>
      <OfferForm mode="edit" offer={offer} tags={tags ?? []} />
    </div>
  );
}
