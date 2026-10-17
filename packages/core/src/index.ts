export type Role = 'customer' | 'rider' | 'vendor' | 'ops';

export const appLabels: Record<Role, string> = {
  customer: 'Customer',
  rider: 'Rider',
  vendor: 'Vendor',
  ops: 'Ops'
};

export const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));

export const appRoutes: Record<Role, string> = {
  customer: '/customer',
  rider: '/rider',
  vendor: '/vendor',
  ops: '/ops'
};

export * from './supabase';
export * from './dispatch-data';
