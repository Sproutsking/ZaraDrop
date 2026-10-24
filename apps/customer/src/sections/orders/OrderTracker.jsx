import { Bike, Check, CreditCard, Star } from 'lucide-react';

const cn = (...values) => values.filter(Boolean).join(' ');

export default function OrderTracker({ order, done, finish, say, stages, ContactBar, LiveMap, formatTotal, startPaystackCheckout, retryingPayment }) {
  const paymentPending = order.paymentMethod === 'paystack' && order.paymentStatus !== 'paid';
  const paymentFailed = order.paymentStatus === 'failed';
  return <div className={cn('cd', !done && 'hl')}>
    <div className="lb">{order.status === 'cancelled' ? 'Cancelled order' : paymentPending ? 'Payment pending' : 'Live order'} · {order.id} · {order.v.n}</div><h1 className="serif" style={{ fontSize: 28 }}>{order.status === 'cancelled' ? 'Order cancelled' : paymentPending ? paymentFailed ? 'Payment not completed' : 'Complete payment to start' : order.status === 'delivered' ? 'Delivered. Enjoy!' : order.stage < 3 ? <>Ready in about <span className="ac">{order.eta} min</span></> : <>Arriving in <span className="ac">{Math.max(2, order.eta)} min</span></>}</h1>
    {paymentPending && <div className="pl w" style={{ marginTop: 12 }}><CreditCard size={16} /><span className="fl">Your order will be sent to the vendor after Paystack confirms payment.</span><button className="bt p s" disabled={retryingPayment} onClick={() => startPaystackCheckout(order.dbId)}>{retryingPayment ? 'Opening…' : paymentFailed ? 'Retry payment' : 'Pay now'}</button></div>}
    {!paymentPending && order.status !== 'cancelled' && <div style={{ margin: '14px 0' }}><LiveMap orderId={order.dbId} /></div>}
    {!paymentPending && order.status !== 'cancelled' && <div className="st">{stages.map((stage, index) => <i key={stage} className={index < order.stage || done ? 'd' : index === order.stage ? 'n' : ''} />)}</div>}
    {!paymentPending && order.status !== 'cancelled' && <div className="row xs mu mono" style={{ justifyContent: 'space-between' }}>{stages.map((stage, index) => <span key={stage} className={index === order.stage ? 'ac' : ''}>{stage}</span>)}</div>}
    {!done && !paymentPending && order.rq && <div className="row xs" style={{ marginTop: 12 }}><Bike size={14} className="ac" /><span className="fl">{order.rq.mode === 'rider' ? <>Requested rider · <b>{order.rq.rider.n}</b></> : 'Order pool · nearest rider'}</span><span className={cn('ch', order.riderId && 'g')}>{order.riderId ? <><Check size={11} />Rider found</> : order.rq.mode === 'rider' ? 'Waiting for reply' : 'Finding a rider'}</span></div>}
    {!done && !paymentPending && <div style={{ marginTop: 16 }}><div className="lb" style={{ marginBottom: 8 }}>Talk to them · free in-app</div><ContactBar order={order.id} orderId={order.dbId} peers={['rider', 'vendor', 'sup']} say={say} /></div>}
    <div className="row" style={{ borderTop: '1px solid var(--bd)', paddingTop: 12, marginTop: 14 }}><span className="fl mu xs">{order.items.join(' · ')}</span><b>{formatTotal(order)}</b></div>
    {done && order.status === 'delivered' && <button className="bt p w" style={{ marginTop: 12 }} onClick={finish}><Star size={15} />Rate and close</button>}
  </div>;
}
