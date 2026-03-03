import type { Metadata } from 'next';
import { getDeal, getVendor } from '@/lib/firestore';

type Props = {
  params: Promise<{ dealId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dealId } = await params;

  try {
    const deal = await getDeal(dealId);
    if (!deal) {
      return {
        title: 'Payment — SafeTrade Ghana',
        description: 'Secure escrow payment powered by SafeTrade.',
      };
    }

    const vendor = await getVendor(deal.vendorId);
    const vendorName = vendor?.displayName || deal.vendorName;

    return {
      title: `Pay ₵${deal.amountGHS.toFixed(2)} for ${deal.itemName} — SafeTrade`,
      description: `Securely pay ${vendorName} for "${deal.itemName}" using SafeTrade escrow. Your money is protected until you confirm delivery.`,
      openGraph: {
        title: `Pay ₵${deal.amountGHS.toFixed(2)} for ${deal.itemName} — SafeTrade`,
        description: `Securely pay ${vendorName} for "${deal.itemName}". Protected by SafeTrade escrow on BNB Chain.`,
        type: 'website',
        siteName: 'SafeTrade Ghana',
      },
      twitter: {
        card: 'summary',
        title: `SafeTrade: Pay ₵${deal.amountGHS.toFixed(2)} for ${deal.itemName}`,
        description: `Secure escrow payment to ${vendorName}. Your money is protected.`,
      },
    };
  } catch {
    return {
      title: 'Secure Payment — SafeTrade Ghana',
      description: 'Pay securely with SafeTrade escrow.',
    };
  }
}

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
