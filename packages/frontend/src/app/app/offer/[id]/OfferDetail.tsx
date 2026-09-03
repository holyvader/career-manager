import { Link, Tabs } from '@ds';
import { notFound } from 'next/navigation';
import { OfferPreview } from '@/app/app/offer/OfferPreview';
import { edenServer } from '@/lib/eden-server';
import { OfferForm } from '../OfferForm';

interface OfferDetailProps {
  params: Promise<{ id: string }>;
}

export async function OfferDetail({ params }: OfferDetailProps) {
  const { id } = await params;
  const [{ data: offer }] = await Promise.all([
    edenServer.me.offers({ id }).get(),
  ]);

  if (!offer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-lg font-semibold">{offer.title}</h2>
      <Link href={`/app/offer/${id}/edit`}>Edit</Link>
      <OfferPreview offer={offer} />
    </div>
  );
}
