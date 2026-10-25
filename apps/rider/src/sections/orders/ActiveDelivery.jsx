import { Check, Info, Navigation } from 'lucide-react';

const cn = (...values) => values.filter(Boolean).join(' ');

export default function ActiveDelivery({ act, step, steps, peers, say, ring, clearRing, onNext, onDetails, onSimulateCall, ContactBar, LiveMap }) {
  return <div className="cd hl"><div className="row"><span className="lb fl">Active · {act.id}</span><span className="ch g">{steps[step][0]}</span></div>
    <div className="st">{[0, 1, 2].map((index) => <i key={index} className={index < step ? 'd' : index === step ? 'n' : ''} />)}</div><LiveMap orderId={act.dbId} active={step >= 1} />
    <div className="row" style={{ margin: '12px 0' }}><Navigation size={16} className="ac" /><div className="fl"><div className="b tr">{step === 0 ? act.v + ', ' + act.area : act.to}</div><div className="xs mu">Order ETA: {act.min} min · route distance unavailable</div></div><button className="bt s" onClick={onDetails}><Info size={13} />Details</button></div>
    <ContactBar order={act.id} orderId={act.dbId} peers={peers} say={say} ring={ring} clearRing={clearRing} />
    <button className="bt p w xl" style={{ marginTop: 14 }} disabled={step === 0 && act.status !== 'ready'} onClick={onNext}><Check size={20} />{step === 0 && act.status !== 'ready' ? 'Waiting for vendor' : steps[step][1]}</button>
  </div>;
}
