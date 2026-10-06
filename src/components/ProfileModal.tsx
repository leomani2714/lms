import { useState, useEffect } from 'react';
import { User as UserIcon, Save, X, GraduationCap, Shield, Loader2 } from 'lucide-react';
import type { Profile } from '@/lib/supabase';

type Props = {
  profile: Profile | null;
  email: string;
  onClose: () => void;
  onSave: (updates: { display_name?: string; bio?: string; avatar_url?: string }) => Promise<void>;
};

export default function ProfileModal({ profile, email, onClose, onSave }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setBio(profile?.bio ?? '');
    setAvatarUrl(profile?.avatar_url ?? '');
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error handled by caller
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || email || '?').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Profile Settings</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-slate-900">{displayName || 'Your name'}</div>
              <div className="text-xs text-slate-500">{email}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {profile?.role === 'instructor' ? (
                  <><Shield className="w-3 h-3" /> Instructor</>
                ) : (
                  <><GraduationCap className="w-3 h-3" /> Student</>
                )}
              </div>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name as shown to others"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Avatar URL (optional)</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description about yourself"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-y transition-all"
            />
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Profile saved
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
