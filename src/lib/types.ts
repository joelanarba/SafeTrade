export interface Deal {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  itemName: string;
  description: string;
  amountGHS: number;
  platformFee: number;
  vendorPayout: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  status: DealStatus;
  paystackReference: string;
  escrowTxHash: string;
  releaseTxHash: string;
  createdAt: string;
  updatedAt: string;
  disputeReason: string;
  disputePhoto: string;
  confirmationToken: string;
  deliveryMethod?: DeliveryMethod;
  trackingNumber?: string;
  disputeCategory?: string;
  disputePhotos?: string[];
}

export type DeliveryMethod = 'personal' | 'courier' | 'pickup';

export type DealStatus =
  | 'pending_payment'
  | 'in_escrow'
  | 'delivered'
  | 'disputed'
  | 'completed'
  | 'refunded'
  | 'cancelled';

export interface Vendor {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  momoNumber: string;
  momoProvider: 'MTN' | 'Vodafone' | 'AirtelTigo';
  trustScore: number;
  totalTrades: number;
  successfulTrades: number;
  disputes: number;
  createdAt: string;
  verified: boolean;
  photoURL: string;
  walletAddress?: string;
}

export interface EscrowState {
  dealId: string;
  vendorAddress: string;
  amount: bigint;
  funded: boolean;
  released: boolean;
  refunded: boolean;
}

export const STATUS_LABELS: Record<DealStatus, string> = {
  pending_payment: 'Awaiting Payment',
  in_escrow: 'In Escrow',
  delivered: 'Delivered',
  disputed: 'Disputed',
  completed: 'Completed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<DealStatus, string> = {
  pending_payment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  in_escrow: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  disputed: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};
