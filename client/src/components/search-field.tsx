import { SearchIcon } from '@/components/icons';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export const SearchField = ({ value, onChange, placeholder, className }: SearchFieldProps) => (
  <label className={`relative block ${className ?? 'w-full max-w-sm'}`}>
    <span className="sr-only">{placeholder}</span>
    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="rounded-card w-full border border-hairline py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand"
    />
  </label>
);
