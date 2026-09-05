type IconProps = {
  className?: string;
};

export const SearchIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden
    className={className}
  >
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16.2 16.2 21 21" />
  </svg>
);

export const MenuIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden
    className={className}
  >
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden
    className={className}
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Four-pane window — the shop’s whole job, used for Overview. */
export const OverviewIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <rect x="4" y="4.5" width="16" height="15" rx="1" />
    <path d="M4 12h16M12 4.5v15" />
  </svg>
);

export const InvoicesIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <rect x="6" y="3.5" width="12" height="17" rx="1.2" />
    <path d="M9 8.5h6M9 12h6M9 15.5h4" />
  </svg>
);

export const QuotationsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <path d="M7 3.5h7.5L19 8v12.5H7z" />
    <path d="M14.5 3.5V8H19M9.5 12h5M9.5 15.5h3.5" />
  </svg>
);

export const ClientsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <circle cx="9" cy="8" r="2.25" />
    <path d="M4.8 17.5c.5-2.6 2.1-3.8 4.2-3.8s3.7 1.2 4.2 3.8" />
    <circle cx="16.2" cy="8.4" r="1.9" />
    <path d="M13.4 17.5c.3-1.9 1.5-2.8 2.8-2.8 1.4 0 2.6.9 2.8 2.8" />
  </svg>
);

/** Vertical slats — a blind, used for Catalogue. */
export const CatalogueIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <rect x="4" y="4.5" width="16" height="15" rx="1" />
    <path d="M8.5 4.5v15M12 4.5v15M15.5 4.5v15" />
  </svg>
);

export const ReportsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <path d="M5 18.5V11M10 18.5V6.5M15 18.5v-5M20 18.5V9" />
  </svg>
);

export const StaffIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <circle cx="12" cy="8" r="2.4" />
    <path d="M6.8 18c.6-3 2.4-4.4 5.2-4.4s4.6 1.4 5.2 4.4" />
  </svg>
);

export const SettingsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4.5v2.2M12 17.3V19.5M4.5 12h2.2M17.3 12h2.2M6.4 6.4l1.6 1.6M16 16l1.6 1.6M6.4 17.6l1.6-1.6M16 8l1.6-1.6" />
  </svg>
);

export const MoreIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
    <circle cx="5" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="19" cy="12" r="1.4" />
  </svg>
);
