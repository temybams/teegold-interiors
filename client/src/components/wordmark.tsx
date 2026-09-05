type WordmarkProps = {
  className?: string;
};

export const Monogram = ({ className }: WordmarkProps) => (
  <svg viewBox="0 0 40 40" aria-hidden className={className}>
    <rect
      x="20"
      y="2"
      width="25.5"
      height="25.5"
      transform="rotate(45 20 2)"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <text
      x="20"
      y="25"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="var(--font-serif)"
      fontSize="14"
      letterSpacing="0.5"
    >
      TG
    </text>
  </svg>
);

export const Wordmark = ({ className }: WordmarkProps) => (
  <span className={`flex items-center gap-3 ${className ?? ''}`}>
    <Monogram className="size-9 text-brand" />
    <span className="font-serif text-lg tracking-[0.2em] uppercase">Teegold Interiors</span>
  </span>
);
