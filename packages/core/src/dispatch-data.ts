import type { RealtimeChannel } from '@supabase/supabase-js';
import { requireSupabase } from './supabase';

export type AppRole = 'customer' | 'rider' | 'vendor' | 'ops';
export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  role: AppRole;
  display_name: string;
}

export interface VendorRecord {
  id: string;
  name: string;
  description: string;
  kind: string;
  category: string;
  emoji: string;
  country_code: string;
  currency: string;
  pickup_address: string;
  delivery_fee: number;
  prep_minutes: number;
  is_active: boolean;
  menu_items: MenuItemRecord[];
}

export interface MenuItemRecord {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  price: number;
  is_available: boolean;
}

export interface OrderRecord {
  id: string;
  order_number: number;
  customer_id: string;
  vendor_id: string;
  rider_id: string | null;
  status: OrderStatus;
  delivery_address: string;
  customer_note: string;
  currency: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  eta_minutes: number;
  created_at: string;
  vendor?: Pick<VendorRecord, 'name' | 'emoji' | 'pickup_address' | 'country_code' | 'currency'>;
  order_items?: Array<{ item_name: string; quantity: number; unit_price: number }>;
}

export interface RiderPoolOrder {
  id: string;
  order_number: number;
  vendor_id: string;
  vendor_name: string;
  vendor_emoji: string;
  pickup_address: string;
  delivery_address: string;
  customer_note: string;
  currency: string;
  total: number;
  delivery_fee: number;
  eta_minutes: number;
  created_at: string;
  order_items: Array<{ item_name: string; quantity: number; unit_price: number }>;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function signInWithPassword(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string, displayName: string) {
  return requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } }
  });
}

export async function signOut() {
  return requireSupabase().auth.signOut();
}

export async function listActiveVendors() {
  const { data, error } = await requireSupabase()
    .from('vendors')
    .select('id, name, description, kind, category, emoji, country_code, currency, pickup_address, delivery_fee, prep_minutes, is_active, menu_items(id, vendor_id, name, description, category, emoji, price, is_available)')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as unknown as VendorRecord[];
}


export async function placeCustomerOrder(input: {
  vendorId: string;
  deliveryAddress: string;
  note: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}) {
  const { data, error } = await requireSupabase().rpc('place_order', {
    p_vendor_id: input.vendorId,
    p_delivery_address: input.deliveryAddress,
    p_items: input.items.map(({ menuItemId, quantity }) => ({ menu_item_id: menuItemId, quantity })),
    p_note: input.note
  });
  if (error) throw error;
  return data as string;
}

export async function listCustomerOrders() {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select('*, vendor:vendors(name, emoji, pickup_address, country_code, currency), order_items(item_name, quantity, unit_price)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRecord[];
}

export async function listVendorOrders() {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];

  const { data: vendor, error: vendorError } = await client
    .from('vendors')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  if (vendorError) throw vendorError;

  const { data, error } = await client
    .from('orders')
    .select('*, vendor:vendors(name, emoji, pickup_address, country_code, currency), order_items(item_name, quantity, unit_price)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRecord[];
}

export async function listOpsOrders() {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select('*, vendor:vendors(name, emoji, pickup_address, country_code, currency), order_items(item_name, quantity, unit_price)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRecord[];
}

export async function listOpsRiders(): Promise<Profile[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id, role, display_name')
    .eq('role', 'rider')
    .order('display_name');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listAvailableRiderOrders(): Promise<RiderPoolOrder[]> {
  const { data, error } = await requireSupabase().rpc('available_rider_orders');
  if (error) throw error;
  return (data ?? []) as RiderPoolOrder[];
}

export async function listRiderOrders(): Promise<OrderRecord[]> {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await client
    .from('orders')
    .select('*, vendor:vendors(name, emoji, pickup_address, country_code, currency), order_items(item_name, quantity, unit_price)')
    .eq('rider_id', user.id)
    .in('status', ['placed', 'preparing', 'ready', 'on_the_way'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRecord[];
}

export async function getOwnedVendor(): Promise<VendorRecord | null> {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await client
    .from('vendors')
    .select('id, name, description, kind, category, emoji, country_code, currency, pickup_address, delivery_fee, prep_minutes, is_active, menu_items(id, vendor_id, name, description, category, emoji, price, is_available)')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as VendorRecord | null;
}

export async function createOwnedVendor(input: Omit<VendorRecord, 'id' | 'is_active' | 'menu_items'>) {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in as a vendor to create a vendor profile.');

  const { data, error } = await client
    .from('vendors')
    .insert({ ...input, owner_id: user.id, is_active: false })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function setOwnedVendorAvailability(vendorId: string, isActive: boolean) {
  const { error } = await requireSupabase()
    .from('vendors')
    .update({ is_active: isActive })
    .eq('id', vendorId);
  if (error) throw error;
}

export async function createVendorMenuItem(vendorId: string, input: Omit<MenuItemRecord, 'id' | 'vendor_id'>) {
  const { error } = await requireSupabase().from('menu_items').insert({ ...input, vendor_id: vendorId });
  if (error) throw error;
}

export async function setMenuItemAvailability(itemId: string, isAvailable: boolean) {
  const { error } = await requireSupabase().from('menu_items').update({ is_available: isAvailable }).eq('id', itemId);
  if (error) throw error;
}

export async function claimRiderOrder(orderId: string) {
  const { data, error } = await requireSupabase().rpc('claim_order', { p_order_id: orderId });
  if (error) throw error;
  return data as string;
}

export async function setVendorOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await requireSupabase().rpc('set_vendor_order_status', {
    p_order_id: orderId,
    p_status: status
  });
  if (error) throw error;
}

export async function setRiderOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await requireSupabase().rpc('set_rider_order_status', {
    p_order_id: orderId,
    p_status: status
  });
  if (error) throw error;
}

export async function assignOpsOrder(orderId: string, riderId: string) {
  const { error } = await requireSupabase().rpc('assign_order', {
    p_order_id: orderId,
    p_rider_id: riderId
  });
  if (error) throw error;
}

export async function sendOrderMessage(orderId: string, body: string) {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in to send a message.');

  const { error } = await client.from('order_messages').insert({
    order_id: orderId,
    sender_id: user.id,
    body
  });
  if (error) throw error;
}

export interface OrderMessageRecord {
  id: string;
  order_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export async function listOrderMessages(orderId: string): Promise<OrderMessageRecord[]> {
  const { data, error } = await requireSupabase()
    .from('order_messages')
    .select('id, order_id, sender_id, body, created_at')
    .eq('order_id', orderId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as OrderMessageRecord[];
}

export function subscribeToOrders(onChange: () => void): RealtimeChannel {
  return requireSupabase()
    .channel(`orders-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();
}

export function subscribeToMarketplace(onChange: () => void): RealtimeChannel {
  return requireSupabase()
    .channel(`marketplace-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, onChange)
    .subscribe();
}

export function subscribeToOrderMessages(orderId: string, onChange: () => void): RealtimeChannel {
  return requireSupabase()
    .channel(`order-messages-${orderId}-${crypto.randomUUID()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'order_messages',
      filter: `order_id=eq.${orderId}`
    }, onChange)
    .subscribe();
}
