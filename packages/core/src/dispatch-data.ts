import type { RealtimeChannel } from '@supabase/supabase-js';
import { requireSupabase } from './supabase';

export type AppRole = 'customer' | 'rider' | 'vendor' | 'ops';
export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
export type OAuthProvider = 'google' | 'facebook' | 'x' | `custom:${string}`;

export interface Profile {
  id: string;
  role: AppRole;
  display_name: string;
  email?: string | null;
  avatar_url?: string | null;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  country_code: string;
  is_default: boolean;
  created_at: string;
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
  payment_method: 'cash_on_delivery' | 'paystack';
  payment_status: 'not_required' | 'pending' | 'paid' | 'failed';
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
  payment_method: 'cash_on_delivery' | 'paystack';
  payment_status: 'not_required' | 'pending' | 'paid' | 'failed';
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

  const { data, error } = await client.rpc('ensure_current_profile');
  if (error) throw error;
  if (!data) return null;

  const current = data as unknown as Profile;
  const userMetadata = user.user_metadata as Record<string, unknown>;
  const metadataName = [userMetadata.full_name, userMetadata.name, userMetadata.display_name]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return {
    ...current,
    display_name: current.display_name || metadataName || user.email?.split('@')[0] || 'Customer',
    email: user.email ?? null
  };
}

export async function updateCurrentProfile(updates: { display_name?: string; avatar_url?: string | null }): Promise<Profile> {
  const profileUpdates: { display_name?: string; avatar_url?: string | null } = {};
  if (updates.display_name !== undefined) {
    const normalizedName = updates.display_name.trim();
    if (!normalizedName || normalizedName.length > 80) {
      throw new Error('Display name must be between 1 and 80 characters.');
    }
    profileUpdates.display_name = normalizedName;
  }
  if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
  if (!Object.keys(profileUpdates).length) throw new Error('No profile changes were provided.');

  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to update your profile.');

  const { data, error } = await client
    .from('profiles')
    .update(profileUpdates)
    .eq('id', user.id)
    .select('id, role, display_name, avatar_url')
    .single();
  if (error) throw error;
  return { ...data, email: user.email ?? null } as Profile;
}

export async function listCustomerAddresses(): Promise<CustomerAddress[]> {
  const { data, error } = await requireSupabase()
    .from('customer_addresses')
    .select('id, user_id, label, address, country_code, is_default, created_at')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerAddress[];
}

export async function saveCustomerAddress(input: { label: string; address: string; countryCode: string; makeDefault?: boolean }) {
  const label = input.label.trim();
  const address = input.address.trim();
  if (!label || !address) throw new Error('Enter a label and delivery address.');

  const { data, error } = await requireSupabase().rpc('save_customer_address', {
    p_label: label,
    p_address: address,
    p_country_code: input.countryCode,
    p_make_default: Boolean(input.makeDefault)
  });
  if (error) throw error;
  return data as string;
}

export async function updateCustomerAddress(addressId: string, input: { label: string; address: string; countryCode: string }) {
  const label = input.label.trim();
  const address = input.address.trim();
  if (!label || !address) throw new Error('Enter a label and delivery address.');

  const { error } = await requireSupabase()
    .from('customer_addresses')
    .update({ label, address, country_code: input.countryCode })
    .eq('id', addressId);
  if (error) throw error;
}

export async function setDefaultCustomerAddress(addressId: string) {
  const { error } = await requireSupabase().rpc('set_default_customer_address', { p_address_id: addressId });
  if (error) throw error;
}

export async function deleteCustomerAddress(addressId: string) {
  const { error } = await requireSupabase().from('customer_addresses').delete().eq('id', addressId);
  if (error) throw error;
}

export async function uploadProfileAvatar(file: File): Promise<Profile> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Profile photos must be 2 MB or smaller.');

  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to upload a profile photo.');

  const objectPath = `${user.id}/avatar`;
  const { error: uploadError } = await client.storage.from('profile-avatars').upload(objectPath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true
  });
  if (uploadError) throw uploadError;

  const { data } = client.storage.from('profile-avatars').getPublicUrl(objectPath);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  return updateCurrentProfile({ avatar_url: avatarUrl });
}

export async function startOAuthSignIn(provider: OAuthProvider, redirectTo: string) {
  return requireSupabase().auth.signInWithOAuth({ provider, options: { redirectTo } });
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
  paymentMethod: 'cash_on_delivery' | 'paystack';
  items: Array<{ menuItemId: string; quantity: number }>;
}) {
  const { data, error } = await requireSupabase().rpc('place_order', {
    p_vendor_id: input.vendorId,
    p_delivery_address: input.deliveryAddress,
    p_items: input.items.map(({ menuItemId, quantity }) => ({ menu_item_id: menuItemId, quantity })),
    p_note: input.note,
    p_payment_method: input.paymentMethod
  });
  if (error) throw error;
  return data as string;
}

export async function initializePaystackPayment(orderId: string, customerEmail?: string) {
  const { data, error } = await requireSupabase().functions.invoke('paystack-payment', {
    body: { action: 'initialize', orderId, customerEmail }
  });
  if (error) throw error;
  return data as { authorizationUrl: string; reference: string };
}

export async function verifyPaystackPayment(reference: string) {
  const { data, error } = await requireSupabase().functions.invoke('paystack-payment', {
    body: { action: 'verify', reference }
  });
  if (error) throw error;
  return data as { status: 'paid' | 'pending' | 'failed'; orderId: string };
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

export async function getRiderAvailability(): Promise<boolean> {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) return false;

  const { data, error } = await client
    .from('rider_presence')
    .select('is_available')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.is_available ?? false;
}

export async function setRiderAvailability(isAvailable: boolean) {
  const { error } = await requireSupabase().rpc('set_rider_availability', { p_is_available: isAvailable });
  if (error) throw error;
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

export async function updateOwnedVendor(vendorId: string, input: Partial<Pick<VendorRecord, 'name' | 'description' | 'kind' | 'category' | 'emoji' | 'country_code' | 'currency' | 'pickup_address' | 'delivery_fee' | 'prep_minutes'>>) {
  if (input.delivery_fee !== undefined && input.delivery_fee < 0) throw new Error('Delivery fee cannot be negative.');
  if (input.prep_minutes !== undefined && input.prep_minutes < 1) throw new Error('Prep time must be at least one minute.');

  const { data, error } = await requireSupabase()
    .from('vendors')
    .update(input)
    .eq('id', vendorId)
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

export interface RiderLocationRecord {
  order_id: string;
  rider_id: string;
  longitude: number;
  latitude: number;
  updated_at: string;
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

export async function getOrderRiderLocation(orderId: string): Promise<RiderLocationRecord | null> {
  const { data, error } = await requireSupabase()
    .from('order_rider_locations')
    .select('order_id, rider_id, longitude, latitude, updated_at')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data as RiderLocationRecord | null;
}

export async function updateOrderRiderLocation(orderId: string, longitude: number, latitude: number) {
  const { error } = await requireSupabase().rpc('update_order_rider_location', {
    p_order_id: orderId,
    p_longitude: longitude,
    p_latitude: latitude
  });
  if (error) throw error;
}

export function subscribeToRiderLocation(orderId: string, onChange: () => void): RealtimeChannel {
  return requireSupabase()
    .channel(`order-rider-location-${orderId}-${crypto.randomUUID()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'order_rider_locations',
      filter: `order_id=eq.${orderId}`
    }, onChange)
    .subscribe();
}
