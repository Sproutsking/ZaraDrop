import { Bike } from 'lucide-react';

export default function OrdersMonitor({ tab, orders, visibleOrders, riderProfiles, selectedId, onSelectOrder, onOpenAssignment, canAssign, ordersReady, orderFilter, setOrderFilter, Drop, panel }) {
  if (!ordersReady) return <div className="cd mu" role="status">Loading live orders…</div>;

  if (tab === 'live') {
    const activeOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status));
    const unassignedOrders = activeOrders.filter((order) => !order.riderId);
    return <>
      <div className="kp k4"><div><b>{activeOrders.length}</b><span className="xs mu">Active orders</span></div><div><b>{riderProfiles.length}</b><span className="xs mu">Rider accounts</span></div><div><b>{unassignedOrders.length}</b><span className="xs mu">Need a rider</span></div><div><b>{orders.length}</b><span className="xs mu">Total orders</span></div></div>
      <div className="split"><div><div className="tbar" style={{ marginBottom: 10 }}><Drop label="Show" value={orderFilter} options={[["all", "", "All orders"], ["late", "", "Late"], ["norider", "", "No rider"]]} onPick={setOrderFilter} /></div>
        {visibleOrders.map((order) => <button key={order.id} className={'oi' + (selectedId === order.id ? ' on' : '')} onClick={() => onSelectOrder(order.id)}><div className="row"><b className="fl">{order.id}</b></div><div className="xs mu tr">{order.vend} → {order.cust}</div><div className="st">{[0, 1, 2, 3, 4].map((index) => <i key={index} className={index < order.st ? 'd' : index === order.st ? 'n' : ''} />)}</div><div className="xs mono ac">{['Placed', 'Preparing', 'Ready', 'On the way', 'Delivered'][order.st]}</div></button>)}
        {!visibleOrders.length && <div className="cd mu" style={{ textAlign: 'center' }}>No orders yet.</div>}</div>
        <div className="dsk">{selectedId && panel()}</div></div>
    </>;
  }

  if (tab === 'dispatch') {
    const unassignedOrders = orders.filter((order) => !order.riderId && !['delivered', 'cancelled'].includes(order.status));
    return <>
      <p className="mu">{unassignedOrders.length} orders waiting for a rider. Tap one to assign.</p>
      {unassignedOrders.map((order) => <div key={order.dbId} className="cd row"><div className="fl"><div className="b">{order.id} · {order.vend}</div><div className="xs mu">{order.cust}</div></div><button className="bt p s" disabled={!canAssign} onClick={() => onOpenAssignment(order.id)}>Assign</button></div>)}
      <div className="lb">Rider accounts</div><div className="cd lst" style={{ padding: '2px 16px' }}>{riderProfiles.map((rider) => <div key={rider.id} className="rk"><Bike size={18} className="ac" /><div className="fl"><div className="b">{rider.display_name || 'Rider'}</div><div className="xs mu">Registered rider account</div></div></div>)}{!riderProfiles.length && <p className="mu">No rider accounts are available.</p>}</div>
    </>;
  }

  return null;
}
