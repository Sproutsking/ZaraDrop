import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
];
const allowedOrigins = new Set([
  ...defaultOrigins,
  ...(Deno.env.get('PAYSTACK_ALLOWED_APP_ORIGINS') ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
]);

const response = (body: unknown, status: number, origin: string) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  }
});

async function isValidPaystackSignature(payload: string, signature: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(paystackSecret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return difference === 0;
}

async function handlePaystackWebhook(request: Request) {
  if (!serviceRoleKey || !paystackSecret) return new Response('Payment service is not configured', { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? '';
  if (!signature || !(await isValidPaystackSignature(payload, signature))) {
    return new Response('Invalid webhook signature', { status: 401 });
  }

  const event = JSON.parse(payload);
  if (event.event !== 'charge.success' || typeof event.data?.reference !== 'string') {
    return new Response('Event ignored', { status: 200 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const reference = event.data.reference;
  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .select('id, order_id, reference, amount_minor, currency')
    .eq('reference', reference)
    .maybeSingle();
  if (paymentError || !payment) return new Response('Payment attempt not found', { status: 404 });

  const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecret}` }
  });
  const verifyResult = await verifyResponse.json();
  if (!verifyResponse.ok || !verifyResult.status) return new Response('Could not verify payment', { status: 502 });
  const transaction = verifyResult.data;
  if (transaction.status !== 'success' ||
      transaction.reference !== payment.reference ||
      Number(transaction.amount) !== Number(payment.amount_minor) ||
      String(transaction.currency).toUpperCase() !== String(payment.currency).toUpperCase()) {
    return new Response('Verified payment does not match stored payment', { status: 409 });
  }

  const { error: confirmError } = await admin.rpc('confirm_paystack_payment', { p_reference: reference });
  if (confirmError) {
    console.error('Could not confirm Paystack webhook payment', confirmError.message);
    return new Response('Could not confirm payment', { status: 500 });
  }
  return new Response('Payment confirmed', { status: 200 });
}

Deno.serve(async (request) => {
  if (request.method === 'POST' && request.headers.has('x-paystack-signature')) {
    try {
      return await handlePaystackWebhook(request);
    } catch (error) {
      console.error('Paystack webhook error', error instanceof Error ? error.message : 'Unknown error');
      return new Response('Webhook could not be processed', { status: 500 });
    }
  }
  const origin = request.headers.get('origin') ?? '';
  if (!allowedOrigins.has(origin)) return new Response('Origin is not allowed', { status: 403 });
  if (request.method === 'OPTIONS') return new Response('ok', { headers: response({}, 200, origin).headers });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405, origin);
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !paystackSecret) {
    return response({ error: 'Payment service is not configured' }, 503, origin);
  }

  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) return response({ error: 'Sign in to continue' }, 401, origin);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return response({ error: 'Sign in to continue' }, 401, origin);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const body = await request.json();

    if (body.action === 'initialize') {
      if (typeof body.orderId !== 'string') return response({ error: 'Order is required' }, 400, origin);

      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('id, customer_id, total, currency, payment_method, payment_status')
        .eq('id', body.orderId)
        .maybeSingle();
      if (orderError || !order || order.customer_id !== user.id) return response({ error: 'Order not found' }, 404, origin);
      if (order.payment_method !== 'paystack' || !['pending', 'failed'].includes(order.payment_status)) {
        return response({ error: 'This order is not awaiting Paystack payment' }, 409, origin);
      }
      if (order.payment_status === 'failed') {
        const { error: resetError } = await admin.from('orders')
          .update({ payment_status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', order.id)
          .eq('payment_status', 'failed');
        if (resetError) return response({ error: 'Could not restart payment for this order' }, 500, origin);
      }

      let customerEmail = user.email ?? (typeof body.customerEmail === 'string' ? body.customerEmail.trim() : '');
      if (!customerEmail) {
        const { data: previousPayment } = await admin.from('payments')
          .select('customer_email')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        customerEmail = previousPayment?.customer_email ?? '';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        return response({ error: 'Enter a valid payment receipt email to continue' }, 400, origin);
      }

      const currency = String(order.currency).toUpperCase();
      if (!['NGN', 'GHS', 'KES', 'ZAR'].includes(currency)) {
        return response({ error: 'Paystack does not support this order currency' }, 400, origin);
      }
      const amountMinor = Math.round(Number(order.total) * 100);
      if (!Number.isSafeInteger(amountMinor) || amountMinor < 1) {
        return response({ error: 'Order total is invalid' }, 400, origin);
      }

      const { data: pendingPayment } = await admin.from('payments')
        .select('authorization_url')
        .eq('order_id', order.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pendingPayment?.authorization_url) {
        return response({ authorizationUrl: pendingPayment.authorization_url }, 200, origin);
      }

      const reference = `ZARADROP-${crypto.randomUUID()}`;
      const callbackUrl = new URL('/', origin);
      callbackUrl.searchParams.set('paystack', 'return');

      const initializeResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: customerEmail,
          amount: amountMinor,
          currency,
          reference,
          callback_url: callbackUrl.toString(),
          metadata: { order_id: order.id, customer_id: user.id }
        })
      });
      const initializeResult = await initializeResponse.json();
      if (!initializeResponse.ok || !initializeResult.status || !initializeResult.data?.authorization_url) {
        console.error('Paystack initialization failed', initializeResult.message ?? initializeResponse.status);
        return response({ error: 'Could not start Paystack checkout' }, 502, origin);
      }

      const { error: paymentError } = await admin.from('payments').insert({
        order_id: order.id,
        provider: 'paystack',
        reference,
        amount_minor: amountMinor,
        currency,
        customer_email: customerEmail,
        authorization_url: initializeResult.data.authorization_url,
        status: 'pending'
      });
      if (paymentError) {
        console.error('Could not save payment attempt', paymentError.message);
        return response({ error: 'Could not record the payment attempt' }, 500, origin);
      }

      return response({ authorizationUrl: initializeResult.data.authorization_url, reference }, 200, origin);
    }

    if (body.action === 'verify') {
      if (typeof body.reference !== 'string' || !body.reference.startsWith('ZARADROP-')) {
        return response({ error: 'Payment reference is invalid' }, 400, origin);
      }

      const { data: payment, error: paymentError } = await admin
        .from('payments')
        .select('id, order_id, reference, amount_minor, currency, status')
        .eq('reference', body.reference)
        .maybeSingle();
      if (paymentError || !payment) return response({ error: 'Payment attempt not found' }, 404, origin);
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('id, customer_id, payment_method, payment_status')
        .eq('id', payment.order_id)
        .maybeSingle();
      if (orderError || !order || order.customer_id !== user.id) return response({ error: 'Payment attempt not found' }, 404, origin);

      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.reference)}`, {
        headers: { Authorization: `Bearer ${paystackSecret}` }
      });
      const verifyResult = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyResult.status) {
        console.error('Paystack verification failed', verifyResult.message ?? verifyResponse.status);
        return response({ error: 'Could not verify payment yet' }, 502, origin);
      }
      const transaction = verifyResult.data;
      if (transaction.status !== 'success') {
        if (['failed', 'abandoned'].includes(transaction.status)) {
          await admin.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', payment.id);
          await admin.from('orders').update({ payment_status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id).eq('payment_status', 'pending');
          return response({ status: 'failed', orderId: order.id }, 200, origin);
        }
        return response({ status: 'pending', orderId: order.id }, 200, origin);
      }
      if (transaction.reference !== payment.reference ||
          Number(transaction.amount) !== Number(payment.amount_minor) ||
          String(transaction.currency).toUpperCase() !== String(payment.currency).toUpperCase() ||
          order.payment_method !== 'paystack') {
        console.error('Paystack verification data does not match the stored payment');
        return response({ error: 'Payment details do not match this order' }, 409, origin);
      }

      const { data: confirmedOrderId, error: confirmError } = await admin.rpc('confirm_paystack_payment', {
        p_reference: payment.reference
      });
      if (confirmError) {
        console.error('Could not confirm payment', confirmError.message);
        return response({ error: 'Payment succeeded but could not be confirmed. Contact support with your reference.' }, 500, origin);
      }
      return response({ status: 'paid', orderId: confirmedOrderId }, 200, origin);
    }

    return response({ error: 'Unsupported payment action' }, 400, origin);
  } catch (error) {
    console.error('Paystack payment handler error', error instanceof Error ? error.message : 'Unknown error');
    return response({ error: 'Payment request could not be completed' }, 500, origin);
  }
});
