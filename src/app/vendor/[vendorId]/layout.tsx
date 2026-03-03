import type { Metadata } from 'next';
import { getVendor } from '@/lib/firestore';

type Props = {
  params: Promise<{ vendorId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorId } = await params;

  try {
    const vendor = await getVendor(vendorId);
    if (!vendor) {
      return {
        title: 'Vendor Profile — SafeTrade Ghana',
        description: 'View seller trust profile on SafeTrade.',
      };
    }

    const tradeText = vendor.successfulTrades === 1 ? '1 trade' : `${vendor.successfulTrades} trades`;

    return {
      title: `${vendor.displayName} — SafeTrade Verified Seller`,
      description: `${vendor.displayName} has completed ${tradeText} on SafeTrade with a ${vendor.trustScore.toFixed(1)} trust score. Check their profile before you buy.`,
      openGraph: {
        title: `${vendor.displayName} — SafeTrade Verified Seller`,
        description: `${tradeText} completed · ${vendor.trustScore.toFixed(1)} trust score. Safe commerce in Ghana.`,
        type: 'profile',
        siteName: 'SafeTrade Ghana',
      },
      twitter: {
        card: 'summary',
        title: `${vendor.displayName} on SafeTrade`,
        description: `${tradeText} completed · ${vendor.trustScore.toFixed(1)} trust score. Verified seller on SafeTrade.`,
      },
    };
  } catch {
    return {
      title: 'Seller Profile — SafeTrade Ghana',
      description: 'Verified seller on SafeTrade.',
    };
  }
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
