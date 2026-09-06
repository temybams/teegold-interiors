import type { ComponentType } from 'react';

import {
  CatalogueIcon,
  ClientsIcon,
  InvoicesIcon,
  OverviewIcon,
  QuotationsIcon,
  ReportsIcon,
  SettingsIcon,
  StaffIcon,
} from '@/components/icons';

import type { Role } from './schemas';

export type NavItem = {
  label: string;
  href: string;
  ready: boolean;
  adminOnly?: boolean;
  icon: ComponentType<{ className?: string }>;
};

export const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', ready: true, icon: OverviewIcon },
  { label: 'Invoices', href: '/invoices', ready: true, icon: InvoicesIcon },
  { label: 'Quotations', href: '/quotations', ready: false, icon: QuotationsIcon },
  { label: 'Clients', href: '/clients', ready: true, icon: ClientsIcon },
  { label: 'Catalogue', href: '/catalogue', ready: true, adminOnly: true, icon: CatalogueIcon },
  { label: 'Reports', href: '/reports', ready: true, icon: ReportsIcon },
  { label: 'Staff', href: '/staff', ready: true, adminOnly: true, icon: StaffIcon },
  { label: 'Settings', href: '/settings', ready: true, adminOnly: true, icon: SettingsIcon },
];

export const mobileTabs: NavItem[] = [
  { label: 'Overview', href: '/dashboard', ready: true, icon: OverviewIcon },
  { label: 'Invoices', href: '/invoices', ready: true, icon: InvoicesIcon },
  { label: 'Clients', href: '/clients', ready: true, icon: ClientsIcon },
];

export const visibleTo = (role: Role) => (item: NavItem) => !item.adminOnly || role === 'ADMIN';
