import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { updateCurrentProfile, uploadProfileAvatar } from '@zaradrop/core';
import { useAuthenticatedProfile, useUpdateAuthenticatedProfile } from './AuthGate';

export function ProfileEditor() {
  const profile = useAuthenticatedProfile();
  const updateProfile = useUpdateAuthenticatedProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile?.display_name]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await updateCurrentProfile({ display_name: displayName });
      updateProfile(updated);
      setDisplayName(updated.display_name);
      setMessage('Profile updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setUploading(true);
    setMessage('');
    setError('');
    try {
      const updated = await uploadProfileAvatar(file);
      updateProfile(updated);
      setMessage('Profile photo updated across your apps.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload your profile photo.');
    } finally {
      setUploading(false);
    }
  };

  return <form className="cd" onSubmit={(event) => void save(event)}>
    <div className="lb">Profile details</div>
    <div className="row" style={{ gap: 12, marginTop: 12 }}>
      <span className="av" style={{ '--s': '64px', '--g1': '#22d3ee', '--g2': '#6366f1', overflow: 'hidden' } as React.CSSProperties}>
        {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile?.display_name?.[0] || '?')}
      </span>
      <div className="col" style={{ gap: 4 }}>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadAvatar(event)} style={{ display: 'none' }} />
        <button className="bt s" type="button" disabled={uploading} onClick={() => fileInput.current?.click()}>{uploading ? 'Uploading…' : 'Change photo'}</button>
        <span className="xs mu">JPEG, PNG or WebP · max 2 MB</span>
      </div>
    </div>
    <label className="lb" style={{ display: 'grid', gap: 6, marginTop: 12 }}>
      Display name
      <input className="in" autoComplete="name" maxLength={80} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
    </label>
    <label className="lb" style={{ display: 'grid', gap: 6, marginTop: 12 }}>
      Sign-in email
      <input className="in" type="email" value={profile?.email ?? ''} readOnly />
    </label>
    {message && <p className="xs" role="status" style={{ marginTop: 10 }}>{message}</p>}
    {error && <p className="pl w" role="alert" style={{ marginTop: 10 }}>{error}</p>}
    <button className="bt p" type="submit" disabled={saving || !displayName.trim() || displayName.trim() === profile?.display_name} style={{ marginTop: 12 }}>
      {saving ? 'Saving…' : 'Save profile'}
    </button>
  </form>;
}