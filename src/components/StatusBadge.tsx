import { DealStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';

export default function StatusBadge({ status }: { status: DealStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
