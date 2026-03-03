import { ShieldCheck, Award, Leaf } from 'lucide-react';

interface VendorBadgeProps {
  successfulTrades: number;
  trustScore: number;
  verified: boolean;
  className?: string;
}

export default function VendorBadge({ successfulTrades, trustScore, verified, className = '' }: VendorBadgeProps) {
  if (successfulTrades >= 50 && trustScore > 4.5) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 font-bold rounded-full shadow-sm ${className}`}>
        <Award className="w-4 h-4" />
        Top Seller
      </span>
    );
  }
  
  if (verified && successfulTrades >= 10) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-full shadow-sm ${className}`}>
        <ShieldCheck className="w-4 h-4" />
        Verified Vendor
      </span>
    );
  }

  if (successfulTrades < 5) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-full shadow-sm ${className}`}>
        <Leaf className="w-4 h-4" />
        New Seller
      </span>
    );
  }

  return null;
}
