import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { getCurrentProfile, isSupabaseConfigured, signInWithPassword, signOut, signUpWithPassword, supabase, type AppRole, type Profile } from '@zaradrop/core';

type AuthGateProps = {
  role: AppRole;
  allowSignUp?: boolean;
  children: ReactNode;
};

type GateState = 'loading' | 'signed-out' | 'ready' | 'wrong-role' | 'error';

const roleNames: Record<AppRole, string> = {
  customer: 'Customer',
  rider: 'Rider',
  vendor: 'Vendor',
  ops: 'Operations'
};

export function AuthGate({ role, allowSignUp = false, children }: AuthGateProps) {
  const [state, setState] = useState<GateState>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
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
        setMessage(error instanceof Error ? error.message : 'Could not load your account.');
        setState('error');
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
      if (active) setState('signed-out');
    }).catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : 'Could not check your session.');
      setState('error');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [role]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await signUpWithPassword(email, password, name.trim());
        if (error) throw error;
        if (!data.session) {
          setMessage('Check your email to confirm your account, then sign in.');
          setMode('signin');
          return;
        }
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
      }
      const current = await getCurrentProfile();
      setProfile(current);
      setState(current ? (current.role === role ? 'ready' : 'wrong-role') : 'signed-out');
      if (current && current.role !== role) {
        setMessage(`This account has the ${roleNames[current.role]} role and cannot open the ${roleNames[role]} app.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const logOut = async () => {
    if (!supabase) return;
    await signOut();
    setProfile(null);
    setState('signed-out');
  };

  if (isSupabaseConfigured && state === 'loading') {
    return <div className="auth-page"><p className="auth-caption">Dispatch {roleNames[role]}</p><h1>Checking your session</h1></div>;
  }

  if (isSupabaseConfigured && state === 'ready') return <>{children}</>;

  const configured = isSupabaseConfigured;
  const canSignUp = allowSignUp && mode === 'signup';

  return <main className="auth-page">
    <style>{`
      .auth-page{min-height:100vh;display:grid;place-content:center;padding:28px;background:#09090c;color:#f4f4f6;font:14px/1.5 'DM Sans',system-ui,sans-serif}
      .auth-box{width:min(420px,calc(100vw - 32px));padding:28px;border:1px solid #26262e;border-radius:20px;background:#111115}
      .auth-mark{width:42px;height:46px;display:grid;place-items:center;margin-bottom:22px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(180deg,#9a73ff,#7d4fff);font-weight:800}
      .auth-caption{margin:0 0 5px;color:#b79bff;font:500 11px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase}
      .auth-box h1{margin:0 0 8px;font:700 28px/1.15 Fraunces,Georgia,serif}
      .auth-copy{margin:0 0 22px;color:#a3a3b0}
      .auth-form{display:grid;gap:13px}
      .auth-form label{display:grid;gap:6px;color:#a3a3b0;font-size:12px}
      .auth-form input{height:44px;padding:0 12px;border:1px solid #3c3c49;border-radius:12px;background:#0d0d10;color:#f4f4f6;font:inherit;outline:none}
      .auth-form input:focus{border-color:#8f63ff}
      .auth-submit,.auth-secondary{height:44px;padding:0 16px;border:1px solid #8f63ff;border-radius:999px;background:linear-gradient(180deg,#9a73ff,#7d4fff);color:#fff;font:700 13px inherit;cursor:pointer}
      .auth-submit:disabled{opacity:.5;cursor:wait}
      .auth-secondary{background:transparent;color:#b79bff}
      .auth-message{margin:14px 0 0;padding:10px 12px;border:1px solid #3c3c49;border-radius:12px;color:#f4f4f6;overflow-wrap:anywhere}
      .auth-note{margin:14px 0 0;color:#a3a3b0;font-size:12px}
      .auth-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px}
      .auth-link{border:0;background:none;color:#b79bff;font:inherit;cursor:pointer}
    `}</style>
    <section className="auth-box">
      <span className="auth-mark">D</span>
      <p className="auth-caption">Dispatch {roleNames[role]}</p>
      {!configured ? <>
        <h1>Connect your workspace</h1>
        <p className="auth-copy">Supabase is not configured for this app yet.</p>
        <p className="auth-note">Copy the root `.env.example` to `.env.local`, add your project's publishable or anon key, and restart the dev servers. Never use a service-role key or personal access token here.</p>
      </> : state === 'wrong-role' ? <>
        <h1>App access is restricted</h1>
        <p className="auth-copy">This account is not assigned to the {roleNames[role]} app.</p>
        <p className="auth-note">Ask an administrator to grant the correct role to this account.</p>
        <button className="auth-submit" onClick={() => void logOut()}>Sign out</button>
      </> : <>
        <h1>{canSignUp ? 'Create customer account' : 'Sign in'}</h1>
        <p className="auth-copy">Use your Dispatch account to continue.</p>
        <form className="auth-form" onSubmit={submit}>
          {canSignUp && <label>Name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete={canSignUp ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="auth-submit" disabled={busy}>{busy ? 'Please wait...' : canSignUp ? 'Create account' : 'Sign in'}</button>
        </form>
        {message && <p className="auth-message" role="status">{message}</p>}
        {allowSignUp && <div className="auth-actions"><span className="auth-note">{mode === 'signin' ? 'New to Dispatch?' : 'Already registered?'}</span><button className="auth-link" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'Create account' : 'Sign in'}</button></div>}
        {!allowSignUp && <p className="auth-note">Rider, vendor and operations accounts are created by an administrator.</p>}
      </>}
      {state === 'error' && message && <p className="auth-message" role="alert">{message}</p>}
    </section>
  </main>;
}
