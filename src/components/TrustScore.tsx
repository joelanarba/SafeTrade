import { Star, StarHalf } from 'lucide-react';

interface TrustScoreProps {
  score: number;
  totalTrades: number;
  compact?: boolean;
}

export default function TrustScore({ score, totalTrades, compact = false }: TrustScoreProps) {
  const fullStars = Math.floor(score);
  const hasHalf = score % 1 >= 0.25;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <span className="text-sm font-semibold text-slate-900">{score.toFixed(1)}</span>
        <span className="text-xs text-slate-500">({totalTrades})</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-5 h-5 text-amber-400 fill-amber-400" />
        ))}
        {hasHalf && <StarHalf className="w-5 h-5 text-amber-400 fill-amber-400" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-5 h-5 text-slate-300" />
        ))}
      </div>
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-900">{score.toFixed(1)}</span> / 5.0 •{' '}
        {totalTrades} trade{totalTrades !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
