import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getOrderRiderLocation, subscribeToRiderLocation, supabase, updateOrderRiderLocation, type RiderLocationRecord } from '@zaradrop/core';

type MapboxOrderMapProps = {
  orderId: string;
  mode: 'track' | 'publish';
  active?: boolean;
};

type Coordinates = { longitude: number; latitude: number };

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const mapToken = env.VITE_MAPBOX_PUBLIC_TOKEN ?? '';

export function MapboxOrderMap({ orderId, mode, active = true }: MapboxOrderMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const lastSent = useRef(0);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('Waiting for rider location');

  useEffect(() => {
    setLocation(null);
    setUpdatedAt(null);
    setMessage('Waiting for rider location');
  }, [orderId]);

  useEffect(() => {
    if (mode !== 'track' || !orderId || !supabase) return;
    let alive = true;
    const refresh = async () => {
      try {
        const latest: RiderLocationRecord | null = await getOrderRiderLocation(orderId);
        if (alive && latest) {
          setLocation({ longitude: latest.longitude, latitude: latest.latitude });
          setUpdatedAt(latest.updated_at);
          const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(latest.updated_at).getTime()) / 1000));
          setMessage(ageSeconds < 60 ? `Rider location · ${ageSeconds}s ago` : `Rider location · ${Math.floor(ageSeconds / 60)}m ago`);
        }
      } catch {
        if (alive) setMessage('Live location is not available yet');
      }
    };
    const channel = subscribeToRiderLocation(orderId, () => void refresh());
    void refresh();
    return () => {
      alive = false;
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [orderId, mode]);

  useEffect(() => {
    if (mode !== 'publish' || !active || !sharing) return;
    if (!mapToken) {
      setMessage('Mapbox is not configured for this app');
      return;
    }
    if (!navigator.geolocation) {
      setMessage('Location is not supported by this device');
      return;
    }

    setMessage('Requesting location permission');
    const watchId = navigator.geolocation.watchPosition(async (position) => {
      const next = { longitude: position.coords.longitude, latitude: position.coords.latitude };
      setLocation(next);
      setUpdatedAt(new Date().toISOString());
      setMessage('Sharing live rider location');
      if (Date.now() - lastSent.current < 10000) return;
      lastSent.current = Date.now();
      try {
        await updateOrderRiderLocation(orderId, next.longitude, next.latitude);
      } catch {
        setMessage('Could not publish location for this order');
      }
    }, (error) => {
      setMessage(error.code === error.PERMISSION_DENIED ? 'Allow location access to share your route' : 'Waiting for a GPS fix');
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId, mode, active, sharing]);

  useEffect(() => {
    if (!mapToken || !container.current || map.current) return;
    mapboxgl.accessToken = mapToken;
    const instance = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: location ? [location.longitude, location.latitude] : [0, 15],
      zoom: location ? 14 : 1.5,
      attributionControl: true,
      cooperativeGestures: true
    });
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    instance.on('error', () => setMessage('Mapbox could not load this map'));
    map.current = instance;
    return () => {
      marker.current?.remove();
      marker.current = null;
      instance.remove();
      map.current = null;
    };
  }, [Boolean(mapToken)]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !location) return;
    const point: [number, number] = [location.longitude, location.latitude];
    if (!marker.current) {
      marker.current = new mapboxgl.Marker({ color: '#7556ef' }).setLngLat(point).addTo(instance);
      instance.flyTo({ center: point, zoom: 15, duration: 700 });
      return;
    }
    marker.current.setLngLat(point);
  }, [location]);

  return <section className="mapbox-order-map" aria-label={mode === 'publish' ? 'Share rider location' : 'Live rider location'}>
    <style>{`
      .mapbox-order-map{position:relative;min-height:260px;overflow:hidden;border:1px solid var(--bd,#26262e);border-radius:16px;background:var(--s2,#15151a)}
      .mapbox-order-map-canvas{width:100%;height:260px}
      .mapbox-order-map-status{position:absolute;z-index:2;left:12px;right:58px;top:12px;display:flex;align-items:center;gap:8px;width:max-content;max-width:calc(100% - 84px);padding:8px 11px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(12,15,18,.88);color:#f4f6f7;font:600 11px/1.2 'DM Sans',system-ui,sans-serif;backdrop-filter:blur(10px)}
      .mapbox-order-map-status i{width:7px;height:7px;flex:none;border-radius:50%;background:#bbc2c8}.mapbox-order-map-status i.live{background:#b7f45c;box-shadow:0 0 10px rgba(183,244,92,.6)}
      .mapbox-order-map-empty{display:grid;align-content:center;justify-items:center;gap:8px;min-height:260px;padding:22px;color:var(--mu,#a3a3b0);text-align:center;font:12px/1.5 'DM Sans',system-ui,sans-serif}.mapbox-order-map-empty strong{color:var(--tx,#f4f4f6);font-size:14px}
      .mapbox-order-map-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-top:1px solid var(--bd,#26262e);background:var(--s1,#0d0d10);color:var(--mu,#a3a3b0);font:12px/1.4 'DM Sans',system-ui,sans-serif}
      .mapbox-order-map .mapboxgl-ctrl-group{overflow:hidden;border:1px solid rgba(10,15,20,.15);border-radius:9px;box-shadow:0 3px 14px rgba(0,0,0,.18)}
      @media(max-width:520px){.mapbox-order-map,.mapbox-order-map-canvas,.mapbox-order-map-empty{min-height:220px;height:220px}.mapbox-order-map-status{top:9px;left:9px}}
    `}</style>
    {mapToken ? <>
      <div className="mapbox-order-map-canvas" ref={container} />
      <div className="mapbox-order-map-status" role="status"><i className={location ? 'live' : ''} />{message}</div>
      {mode === 'publish' && active && <div className="mapbox-order-map-controls"><span>{sharing ? 'Location is shared for this active order only.' : 'Start sharing only while completing this delivery.'}</span><button className="bt s" type="button" onClick={() => setSharing((current) => !current)}>{sharing ? 'Stop sharing' : 'Start sharing'}</button></div>}
    </> : <div className="mapbox-order-map-empty"><strong>Mapbox token required</strong><span>Add `VITE_MAPBOX_PUBLIC_TOKEN` to the root environment and restart the app.</span></div>}
  </section>;
}
