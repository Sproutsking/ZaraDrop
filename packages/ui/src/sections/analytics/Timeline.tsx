import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PeriodKey = 'D' | 'W' | 'M' | 'Y' | 'C';
type Span = { f: number; e: number; label: string };
type Bar = { l: string; f: string; v: number };
export type TimelineConfig = { base: number; salt: number; zero?: number; avg: number; step?: number; inv?: boolean };
type TimelineStats = { total: number; n: number; data: Bar[]; k: PeriodKey; delta: number | null; prev: number; len: number };
type TimelineProps = {
  cfg: TimelineConfig;
  m: (value: number) => string;
  live?: number | null;
  liveN?: number | null;
  title: string;
  children: (stats: TimelineStats) => ReactNode;
};

const DAY = 864e5;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HRS = [0, 0, 0, 0, 0, 0, .01, .03, .06, .07, .05, .07, .12, .1, .05, .04, .05, .08, .12, .1, .07, .04, .02, .01];
const HS = HRS.reduce((total, value) => total + value, 0);
const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export const sod = (value: number) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
const rnd = (value: number) => {
  const result = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return result - Math.floor(result);
};
const fmtD = (value: number) => {
  const date = new Date(value);
  return date.getDate() + ' ' + MON[date.getMonth()];
};
const iso = (value: number) => {
  const date = new Date(value);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};
const parse = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
};
export const days = (from: number, to: number) => {
  const result: number[] = [];
  const date = new Date(from);
  while (date.getTime() <= to) {
    result.push(date.getTime());
    date.setDate(date.getDate() + 1);
  }
  return result;
};

function span(key: PeriodKey, offset: number, custom: [string, string]): Span {
  const today = sod(Date.now());
  if (key === 'D') {
    const from = today + offset * DAY;
    return { f: from, e: from, label: offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : fmtD(from) };
  }
  if (key === 'W') {
    const to = today + offset * 7 * DAY;
    const from = to - 6 * DAY;
    return { f: from, e: to, label: offset === 0 ? 'Last 7 days' : fmtD(from) + ' – ' + fmtD(to) };
  }
  if (key === 'M') {
    const date = new Date(today);
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    return { f: date.getTime(), e: new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime(), label: MON[date.getMonth()] + ' ' + date.getFullYear() };
  }
  if (key === 'Y') {
    const year = new Date(today).getFullYear() + offset;
    return { f: new Date(year, 0, 1).getTime(), e: new Date(year, 11, 31).getTime(), label: String(year) };
  }
  let from = parse(custom[0]);
  let to = parse(custom[1]);
  if (to < from) [from, to] = [to, from];
  return { f: from, e: to, label: fmtD(from) + ' – ' + fmtD(to) };
}

export const makeValue = (config: TimelineConfig, live?: number | null) => (time: number) => {
  const today = sod(Date.now());
  if (time > today) return 0;
  if (time === today && live != null) return live;
  const day = Math.floor(time / DAY);
  if (config.zero && rnd(day + config.salt + 99) < config.zero) return 0;
  const weekday = new Date(time).getDay();
  const step = config.step || 10;
  return Math.round(config.base * (0.5 + rnd(day + config.salt) * 0.9) * (weekday === 0 || weekday >= 5 ? 1.25 : 1) / step) * step;
};

function barsOf(key: PeriodKey, range: Span, valueAt: (time: number) => number): Bar[] {
  if (key === 'D') {
    const now = new Date();
    const today = valueAt(range.f);
    return Array.from({ length: 24 }, (_, hour) => ({
      l: hour % 3 ? '' : (hour % 12 || 12) + (hour < 12 ? 'a' : 'p'),
      f: (hour % 12 || 12) + (hour < 12 ? ' AM' : ' PM'),
      v: range.f === sod(now.getTime()) && hour > now.getHours() ? 0 : Math.round(today * HRS[hour] / HS)
    }));
  }
  if (key === 'Y') {
    const year = new Date(range.f).getFullYear();
    return MON.map((month, index) => ({
      l: month[0],
      f: month + ' ' + year,
      v: days(new Date(year, index, 1).getTime(), new Date(year, index + 1, 0).getTime()).reduce((total, time) => total + valueAt(time), 0)
    }));
  }
  const dates = days(range.f, range.e);
  if (key === 'W') return dates.map((time) => ({ l: DOW[new Date(time).getDay()], f: fmtD(time), v: valueAt(time) }));
  if (key === 'M' || dates.length <= 31) {
    return dates.map((time, index) => ({ l: index % 5 === 0 ? String(new Date(time).getDate()) : '', f: fmtD(time), v: valueAt(time) }));
  }
  const groupSize = Math.ceil(dates.length / 24);
  const result: Bar[] = [];
  for (let index = 0; index < dates.length; index += groupSize) {
    const group = dates.slice(index, index + groupSize);
    result.push({
      l: result.length % 4 ? '' : fmtD(group[0]),
      f: fmtD(group[0]) + ' – ' + fmtD(group[group.length - 1]),
      v: group.reduce((total, time) => total + valueAt(time), 0)
    });
  }
  return result;
}

export function Timeline({ cfg, m, live, liveN, title, children }: TimelineProps) {
  const [key, setKey] = useState<PeriodKey>('W');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState<[string, string]>([iso(Date.now() - 13 * DAY), iso(Date.now())]);
  const valueAt = makeValue(cfg, live);
  const range = span(key, offset, custom);
  const data = barsOf(key, range, valueAt);
  const dates = days(range.f, range.e);
  const total = dates.reduce((sum, time) => sum + valueAt(time), 0);
  const previousSpan = key === 'C' ? { f: range.f - dates.length * DAY, e: range.f - DAY } : span(key, offset - 1, custom);
  const previous = days(previousSpan.f, previousSpan.e).reduce((sum, time) => sum + valueAt(time), 0);
  const delta = previous ? Math.round((total - previous) / previous * 100) : null;
  const today = key === 'D' && offset === 0;
  const count = today && liveN != null ? liveN : Math.round(total / cfg.avg);
  const maximum = Math.max(1, ...data.map((bar) => bar.v));
  const top = data.findIndex((bar) => bar.v === maximum);
  const favorable = delta !== null && (cfg.inv ? delta <= 0 : delta >= 0);
  const pick = (period: PeriodKey, nextOffset: number) => {
    setKey(period);
    setOffset(nextOffset);
    setSelected(null);
  };

  return <div className="col">
    <div className="seg" role="tablist" aria-label="Timeline">{([['D', 'Day'], ['W', 'Week'], ['M', 'Month'], ['Y', 'Year'], ['C', 'Custom']] as Array<[PeriodKey, string]>).map(([period, label]) => <button key={period} role="tab" aria-selected={key === period} className={key === period ? 'on' : ''} onClick={() => pick(period, 0)}>{label}</button>)}</div>
    {key === 'C' ? <div className="dt"><label><span className="lb">From</span><input type="date" value={custom[0]} max={iso(Date.now())} onChange={(event) => event.target.value && setCustom([event.target.value, custom[1]])} /></label><label><span className="lb">To</span><input type="date" value={custom[1]} max={iso(Date.now())} onChange={(event) => event.target.value && setCustom([custom[0], event.target.value])} /></label></div>
      : <div className="pn"><button className="ib" aria-label="Previous period" disabled={offset <= -60} onClick={() => pick(key, offset - 1)}><ChevronLeft size={16} /></button><div className="fl b" style={{ textAlign: 'center' }}>{range.label}</div><button className="ib" aria-label="Next period" disabled={offset >= 0} onClick={() => pick(key, offset + 1)}><ChevronRight size={16} /></button></div>}
    <div className="cd hl"><div className="lb">{title}{selected != null ? ' · ' + data[selected].f : ''}</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 4 }}><h1 className="serif" style={{ fontSize: 36 }}>{m(selected != null ? data[selected].v : total)}</h1>{selected == null && delta !== null && <span className={cn('ch', favorable ? 'g' : 'r')}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs previous</span>}</div>
      <div className="chart" role="list">{data.map((bar, index) => <button key={index} role="listitem" className={cn(index === top && maximum > 1 && 'top', selected === index && 'sel')} aria-label={bar.f + ': ' + m(bar.v)} onClick={() => setSelected(selected === index ? null : index)}><i style={{ height: Math.max(3, bar.v / maximum * 116) }} /><span>{bar.l}</span></button>)}</div>
      <div className="xs mu" style={{ marginTop: 8 }}>Tap a bar for its exact value.</div></div>
    {children({ total, n: count, data, k: key, delta, prev: previous, len: dates.length })}
  </div>;
}
