import { Component, createContext, ErrorInfo, ReactNode, useContext, useEffect, useState } from 'react';
import { getCurrentProfile, isSupabaseConfigured, signOut, startOAuthSignIn, supabase, type AppRole, type OAuthProvider, type Profile } from '@zaradrop/core';
import { SiFacebook, SiGoogle, SiInstagram, SiTiktok, SiX } from '@icons-pack/react-simple-icons';

type AuthGateProps = { role: AppRole; children: ReactNode };

type GateState = 'loading' | 'signed-out' | 'ready' | 'wrong-role' | 'error';
type AuthenticatedProfileContextValue = {
  profile: Profile | null;
  updateProfile: (profile: Profile) => void;
};
const AuthenticatedProfileContext = createContext<AuthenticatedProfileContextValue>({ profile: null, updateProfile: () => {} });

export function useAuthenticatedProfile() {
  return useContext(AuthenticatedProfileContext).profile;
}

export function useUpdateAuthenticatedProfile() {
  return useContext(AuthenticatedProfileContext).updateProfile;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Authenticated app failed to render.', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return <main className="auth-page"><section className="auth-frame" style={{ minHeight: 0, maxWidth: 640 }}>
      <div className="auth-main">
        <h2>We could not open the app</h2>
        <p className="auth-copy">Your account is signed in, but the app hit an error while loading.</p>
        <p className="auth-message" role="alert">{this.state.error.message || 'Unexpected app error.'}</p>
        <button className="auth-submit" type="button" onClick={() => window.location.reload()}>Reload app</button>
      </div>
    </section></main>;
  }
}

const roleNames: Record<AppRole, string> = {
  customer: 'Customer',
  rider: 'Rider',
  vendor: 'Vendor',
  ops: 'Operations'
};

const providers: Array<{ id: OAuthProvider; label: string; Icon: typeof SiGoogle }> = [
  { id: 'google', label: 'Google', Icon: SiGoogle },
  { id: 'x', label: 'X', Icon: SiX },
  { id: 'facebook', label: 'Facebook', Icon: SiFacebook },
  { id: 'custom:tiktok', label: 'TikTok', Icon: SiTiktok },
  { id: 'custom:instagram', label: 'Instagram', Icon: SiInstagram }
];

const roleIdentity: Record<AppRole, { code: string; label: string; first: string; second: string }> = {
  customer: { code: '01', label: 'CUSTOMER PORTAL', first: 'Good food,', second: 'next move.' },
  rider: { code: '02', label: 'RIDER PORTAL', first: 'Keep the city', second: 'moving.' },
  vendor: { code: '03', label: 'VENDOR PORTAL', first: 'Your kitchen,', second: 'in control.' },
  ops: { code: '04', label: 'OPERATIONS', first: 'Every order.', second: 'In view.' }
};

function clearOAuthTokensFromUrl() {
  const hash = window.location.hash;
  if (!hash) return;
  const params = new URLSearchParams(hash.slice(1));
  if (!params.has('access_token') && !params.has('refresh_token')) return;
  window.history.replaceState(window.history.state, document.title, window.location.pathname + window.location.search);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export function AuthGate({ role, children }: AuthGateProps) {
  const [state, setState] = useState<GateState>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) {
      setState('signed-out');
      return;
    }

    let active = true;
    const resolveProfile = async () => {
      try {
        const current = await getCurrentProfile();
        if (!active) return;
        setProfile(current);
        setState(current ? (current.role === role ? 'ready' : 'wrong-role') : 'signed-out');
      } catch (error) {
        if (!active) return;
        setMessage(getErrorMessage(error, 'Could not load your account.'));
        setState('error');
      } finally {
        clearOAuthTokensFromUrl();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
        setState('signed-out');
        return;
      }
      setState('loading');
      window.setTimeout(() => void resolveProfile(), 0);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (data.session) return resolveProfile();
      if (active) {
        setProfile(null);
        setState('signed-out');
      }
    }).catch((error: unknown) => {
      if (!active) return;
      setMessage(getErrorMessage(error, 'Could not check your session.'));
      setState('error');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [role]);

  const continueWith = async (provider: OAuthProvider) => {
    setBusy(provider);
    setMessage('');
    try {
      const { error } = await startOAuthSignIn(provider, window.location.origin);
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not start social sign-in.');
      setBusy(null);
    }
  };

  const logOut = async () => {
    if (!supabase) return;
    await signOut();
    setState('signed-out');
  };

  if (isSupabaseConfigured && state === 'ready') return <AuthenticatedProfileContext.Provider value={{ profile, updateProfile: setProfile }}><AppErrorBoundary>{children}</AppErrorBoundary></AuthenticatedProfileContext.Provider>;

  const configured = isSupabaseConfigured;
  const identity = roleIdentity[role];
  return <main className="auth-page" data-role={role}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      .auth-page{--auth-bg:#080a0d;--auth-panel:#0e1115;--auth-line:#262c32;--auth-muted:#929ca5;--auth-text:#f1f4f5;--auth-accent:#c5ff55;min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:28px;background-color:var(--auth-bg);background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:40px 40px;color:var(--auth-text);font:14px/1.5 'DM Sans',system-ui,sans-serif}
      .auth-page[data-role='rider']{--auth-accent:#ffb15f}.auth-page[data-role='vendor']{--auth-accent:#6de0d0}.auth-page[data-role='ops']{--auth-accent:#ff7d70}
      .auth-frame{display:grid;grid-template-columns:minmax(280px,.88fr) minmax(380px,1.12fr);width:min(1040px,100%);min-height:620px;overflow:hidden;border:1px solid #293038;border-radius:18px;background:var(--auth-panel);box-shadow:0 28px 100px rgba(0,0,0,.42)}
      .auth-aside{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-width:0;padding:34px;background:linear-gradient(145deg,#151b20,#0b0e11 72%);border-right:1px solid var(--auth-line);isolation:isolate;overflow:hidden}
      .auth-aside:after{position:absolute;inset:0;z-index:-1;background:repeating-linear-gradient(135deg,transparent 0 23px,rgba(197,255,85,.045) 23px 24px);content:'';mask-image:linear-gradient(145deg,#000,transparent 65%)}
      .auth-page[data-role='rider'] .auth-aside:after{background:repeating-linear-gradient(135deg,transparent 0 23px,rgba(255,177,95,.06) 23px 24px)}.auth-page[data-role='vendor'] .auth-aside:after{background:repeating-linear-gradient(135deg,transparent 0 23px,rgba(109,224,208,.06) 23px 24px)}.auth-page[data-role='ops'] .auth-aside:after{background:repeating-linear-gradient(135deg,transparent 0 23px,rgba(255,125,112,.06) 23px 24px)}
      .auth-index{position:absolute;right:20px;bottom:22%;z-index:-1;color:var(--auth-accent);font:700 190px/.8 'JetBrains Mono',monospace;opacity:.055;user-select:none}
      .auth-brand{display:flex;align-items:center;gap:12px}.auth-brand-mark{display:grid;place-items:center;width:42px;height:42px;border:1px solid rgba(197,255,85,.45);border-radius:11px;background:rgba(197,255,85,.09);color:var(--auth-accent);font:700 17px 'JetBrains Mono',monospace}
      .auth-brand-name{font:700 16px 'DM Sans',sans-serif;letter-spacing:0}.auth-brand-caption,.auth-eyebrow,.auth-role-tag,.auth-method-count,.auth-aside-footer{font:500 10px 'JetBrains Mono',monospace;letter-spacing:0;text-transform:uppercase}
      .auth-brand-caption{display:block;margin-top:2px;color:var(--auth-muted);font-size:9px}
      .auth-aside-copy{margin:0 0 12px;color:var(--auth-muted);font:500 11px 'JetBrains Mono',monospace;letter-spacing:0;text-transform:uppercase}
      .auth-aside h1{max-width:360px;margin:0;font:600 48px/1.05 'Fraunces',Georgia,serif;letter-spacing:0}.auth-aside h1 span{display:block;color:var(--auth-accent)}
      .auth-role-tag{display:inline-flex;align-items:center;gap:9px;margin-top:25px;padding:9px 11px;border:1px solid #353d43;border-radius:7px;color:#dce2e5;font-size:9px}.auth-role-tag i,.auth-method-count i{width:7px;height:7px;border-radius:50%;background:var(--auth-accent);box-shadow:0 0 12px rgba(197,255,85,.45)}
      .auth-aside-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#74808a;font-size:9px}.auth-aside-footer span:last-child{color:#a5afb6}
      .auth-main{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:46px 54px}.auth-main-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:40px}.auth-eyebrow{color:#a4adb4;font-size:9px}.auth-method-count{display:flex;align-items:center;gap:8px;color:#a4adb4;font-size:9px;white-space:nowrap}.auth-method-count i{width:6px;height:6px}
      .auth-main h2{margin:0;font:600 30px/1.15 'Fraunces',Georgia,serif;letter-spacing:0}.auth-copy{margin:8px 0 26px;color:var(--auth-muted);font-size:13px}
      .auth-providers{display:grid;gap:11px}.auth-provider-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.auth-provider{--provider-color:#f1f4f5;position:relative;display:flex;align-items:center;gap:12px;width:100%;min-width:0;min-height:60px;padding:0 13px;border:1px solid #30383f;border-radius:9px;background:#111519;color:var(--auth-text);font:600 13px 'DM Sans',sans-serif;text-align:left;cursor:pointer;transition:background .16s,border-color .16s,transform .16s}.auth-provider:hover:not(:disabled){transform:translateY(-2px);border-color:var(--provider-color);background:#171d20}.auth-provider:focus-visible,.auth-submit:focus-visible{outline:2px solid var(--auth-accent);outline-offset:3px}.auth-provider:disabled{opacity:.55;cursor:wait}
      .auth-provider-featured{min-height:68px;padding-inline:16px;border-color:#58643d;background:#171d13}.auth-provider-featured .auth-provider-mark{width:38px;height:38px}.auth-provider-featured .auth-provider-label{font-size:14px}.auth-provider-grid .auth-provider{min-height:58px;padding-inline:10px;gap:9px}.auth-provider-grid .auth-provider-mark{width:32px;height:32px}.auth-provider-grid .auth-provider-arrow{margin-left:auto}
      .auth-provider-mark{display:grid;place-items:center;flex:none;width:34px;height:34px;border:1px solid color-mix(in srgb,var(--provider-color) 36%,transparent);border-radius:7px;background:color-mix(in srgb,var(--provider-color) 10%,transparent);color:var(--provider-color)}.auth-provider-mark svg{display:block;width:19px;height:19px;fill:currentColor}.auth-provider-label{flex:1}.auth-provider-action{color:#758089;font:500 9px 'JetBrains Mono',monospace;letter-spacing:0;text-transform:uppercase}.auth-provider-arrow{color:#7f8991;font-size:17px;transition:color .16s,transform .16s}.auth-provider:hover:not(:disabled) .auth-provider-arrow{transform:translate(2px,-2px);color:var(--provider-color)}
      .auth-provider[data-provider='google']{--provider-color:#8ab4f8}.auth-provider[data-provider='facebook']{--provider-color:#5b91ff}.auth-provider[data-provider='x']{--provider-color:#f1f4f5}.auth-provider[data-provider='custom:tiktok']{--provider-color:#69e6e0}.auth-provider[data-provider='custom:instagram']{--provider-color:#ff9b80}
      .auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0 14px;color:#6f7981;font:500 9px 'JetBrains Mono',monospace;letter-spacing:0;text-transform:uppercase}.auth-divider:before,.auth-divider:after{height:1px;flex:1;background:#293037;content:''}
      .auth-message{margin:15px 0 0;padding:11px 13px;border:1px solid #663d3d;border-radius:8px;background:rgba(140,48,48,.12);color:#ffc1b6;font-size:12px;overflow-wrap:anywhere}.auth-note{margin:12px 0 0;color:#929ca5;font-size:11px;line-height:1.55}.auth-note strong{color:#dce2e5;font-weight:600}
      .auth-submit{min-height:42px;padding:0 16px;border:1px solid var(--auth-accent);border-radius:7px;background:var(--auth-accent);color:#11150b;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.auth-submit:hover{background:#d6ff83}
      .auth-loading{display:flex;align-items:center;gap:12px;color:#dce2e5}.auth-spinner{width:17px;height:17px;border:2px solid #384148;border-top-color:var(--auth-accent);border-radius:50%;animation:auth-spin .8s linear infinite}@keyframes auth-spin{to{transform:rotate(360deg)}}
      @media(max-width:760px){.auth-page{padding:14px}.auth-frame{grid-template-columns:1fr;min-height:0}.auth-aside{min-height:190px;padding:22px 24px;border-right:0;border-bottom:1px solid var(--auth-line)}.auth-aside h1{font-size:32px}.auth-aside-copy{margin-bottom:6px}.auth-role-tag{margin-top:13px}.auth-aside-footer{display:none}.auth-index{right:12px;bottom:17%;font-size:130px}.auth-main{padding:28px 24px 30px}.auth-main-top{margin-bottom:25px}}
      @media(max-width:420px){.auth-main{padding-inline:18px}.auth-main-top{align-items:flex-start;flex-direction:column;gap:7px}.auth-provider{min-height:54px}.auth-provider-grid .auth-provider{min-height:54px;padding-inline:8px;gap:7px}.auth-provider-action{display:none}.auth-provider-grid .auth-provider-mark{width:29px;height:29px}}
      @media(prefers-reduced-motion:reduce){.auth-provider,.auth-provider-arrow{transition:none}.auth-spinner{animation-duration:2s}}
    `}</style>
    <div className="auth-frame">
      <aside className="auth-aside">
        <div className="auth-brand"><span className="auth-brand-mark">Z</span><div><div className="auth-brand-name">ZaraDrop</div><span className="auth-brand-caption">Dispatch identity</span></div></div>
        <span className="auth-index" aria-hidden="true">{identity.code}</span>
        <div><p className="auth-aside-copy">{identity.label}</p><h1>{identity.first}<span>{identity.second}</span></h1><span className="auth-role-tag"><i />{roleNames[role]} workspace</span></div>
        <div className="auth-aside-footer"><span>IDENTITY GATEWAY / {identity.code}</span><span>AUTH {configured ? 'READY' : 'OFFLINE'}</span></div>
      </aside>
      <section className="auth-main">
        <div className="auth-main-top"><span className="auth-eyebrow">ACCOUNT ACCESS</span><span className="auth-method-count"><i />{configured ? '05 PROVIDERS' : 'AUTH UNAVAILABLE'}</span></div>
        {isSupabaseConfigured && state === 'loading' ? <div className="auth-loading" role="status"><span className="auth-spinner" />Checking your session</div>
          : !configured ? <>
            <h2>Connection unavailable</h2><p className="auth-copy">We are unable to connect right now. Please try again shortly.</p>
          </> : state === 'wrong-role' ? <>
            <h2>Access is restricted</h2><p className="auth-copy">This account does not have the {roleNames[role]} role.</p>
            <p className="auth-note">Ask an administrator to assign the correct role, then sign in again.</p>
            <button className="auth-submit" onClick={() => void logOut()}>Sign out</button>
          </> : <>
            <h2>Choose your sign-in</h2><p className="auth-copy">Continue with a connected social account.</p>
            <div className="auth-providers">
              {[providers[0]].map((provider) => <button key={provider.id} data-provider={provider.id} className="auth-provider auth-provider-featured" type="button" disabled={busy !== null} onClick={() => void continueWith(provider.id)}>
                <span className="auth-provider-mark" aria-hidden="true"><provider.Icon /></span>
                <span className="auth-provider-label">{busy === provider.id ? `Connecting to ${provider.label}...` : provider.label}</span>
                <span className="auth-provider-action">Recommended</span><span className="auth-provider-arrow" aria-hidden="true">↗</span>
              </button>)}
              <div className="auth-provider-grid">{providers.slice(1).map((provider, index) => <button key={provider.id} data-provider={provider.id} className="auth-provider" type="button" disabled={busy !== null} onClick={() => void continueWith(provider.id)}>
                <span className="auth-provider-mark" aria-hidden="true"><provider.Icon /></span>
                <span className="auth-provider-label">{busy === provider.id ? `Connecting...` : provider.label}</span>
                <span className="auth-provider-action">0{index + 2}</span><span className="auth-provider-arrow" aria-hidden="true">↗</span>
              </button>)}</div>
            </div>
            {message && <p className="auth-message" role="alert">{message}</p>}
            <div className="auth-divider">Identity providers</div>
            {role !== 'customer' && <p className="auth-note"><strong>Staff access:</strong> {roleNames[role]} accounts need an administrator-assigned role.</p>}
            <p className="auth-note">TikTok and Instagram require custom identity-provider configuration.</p>
          </>}
      </section>
    </div>
  </main>;
}
