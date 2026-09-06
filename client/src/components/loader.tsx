import { Monogram } from '@/components/wordmark';

type PageLoaderProps = {
  /** Short status under the mark, e.g. "Signing you in". Keep it short. */
  label?: string;
};

/**
 * Full-screen wait. Used while the session is restored and before a guarded
 * page is allowed to render — never as a button spinner.
 */
export const PageLoader = ({ label = 'Just a moment' }: PageLoaderProps) => (
  <div
    className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <LoaderMark />
    <p className="text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
  </div>
);

type InlineLoaderProps = {
  label?: string;
};

/** Compact wait for a card or a form, not the whole page. */
export const InlineLoader = ({ label = 'Just a moment' }: InlineLoaderProps) => (
  <div
    className="flex flex-col items-center justify-center gap-3 py-12"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <LoaderMark size="sm" />
    <p className="text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
  </div>
);

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

/** Placeholder rows so a table keeps its shape while data arrives. */
export const TableSkeleton = ({ rows = 4, columns = 5 }: TableSkeletonProps) => (
  <div className="px-6 py-2" role="status" aria-live="polite" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, row) => (
      <div key={row} className="flex items-center gap-4 border-t border-hairline py-3.5 first:border-t-0">
        {Array.from({ length: columns }, (__, column) => (
          <div
            key={column}
            className={`teegold-shimmer h-3 rounded-card ${column === columns - 1 ? 'ml-auto w-14' : 'w-full'}`}
          />
        ))}
      </div>
    ))}
  </div>
);

type LoaderMarkProps = {
  size?: 'sm' | 'md';
};

const LoaderMark = ({ size = 'md' }: LoaderMarkProps) => {
  const box = size === 'sm' ? 'size-9' : 'size-12';
  const mark = size === 'sm' ? 'size-7' : 'size-9';

  return (
    <span className={`relative inline-flex items-center justify-center ${box}`}>
      <span aria-hidden className="teegold-spin absolute inset-0 border border-lilac border-t-brand" />
      <Monogram className={`${mark} text-brand`} />
    </span>
  );
};
