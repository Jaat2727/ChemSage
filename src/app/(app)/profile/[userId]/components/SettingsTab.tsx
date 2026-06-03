import { useState, useRef } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Save, Image as ImageIcon, CheckCircle2, UploadCloud, X } from "lucide-react";
import type { Profile } from "@/lib/types";

interface SettingsTabProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

export default function SettingsTab({ profile, setProfile }: SettingsTabProps) {
  const supabase = createClientComponentClient();
  
  const [formData, setFormData] = useState({
    bio: profile.bio || "",
    interests: profile.academic_interests?.join(", ") || "",
    subjects: profile.preferred_subjects?.join(", ") || "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url || null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    } else {
      setBannerFile(file);
      setBannerPreview(previewUrl);
    }
  };

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      let finalAvatarUrl = profile.avatar_url;
      let finalBannerUrl = profile.banner_url;

      if (avatarFile) {
        finalAvatarUrl = await uploadFile(avatarFile, "avatars");
      }
      
      if (bannerFile) {
        finalBannerUrl = await uploadFile(bannerFile, "banners");
      }

      const updates = {
        bio: formData.bio,
        avatar_url: finalAvatarUrl,
        banner_url: finalBannerUrl,
        academic_interests: formData.interests.split(",").map(i => i.trim()).filter(Boolean),
        preferred_subjects: formData.subjects.split(",").map(s => s.trim()).filter(Boolean),
      };

      const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, ...updates });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Cleanup Object URLs
      if (avatarFile) setAvatarFile(null);
      if (bannerFile) setBannerFile(null);
      
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Profile Settings</h2>
        <p className="text-sm text-[var(--muted)]">Manage how your academic identity is presented to the ChemSAGE community.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Images */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
          <h3 className="text-sm font-bold text-white mb-2">Branding</h3>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Avatar Upload */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Profile Picture</label>
              <div className="flex flex-col items-center gap-4 p-4 border border-dashed border-[var(--border)] rounded-xl bg-[var(--background)]">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-[var(--surface-soft)] bg-[var(--surface)] flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-[var(--muted)]" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={avatarInputRef}
                  onChange={(e) => handleFileSelect(e, "avatar")}
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-[var(--surface-soft)] hover:bg-[var(--surface)] px-4 py-2 rounded-lg transition-colors border border-[var(--border)]"
                >
                  <UploadCloud size={14} /> Upload Image
                </button>
              </div>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Profile Banner</label>
              <div className="flex flex-col items-center gap-4 p-4 border border-dashed border-[var(--border)] rounded-xl bg-[var(--background)] h-full justify-between">
                <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-[var(--surface-soft)] bg-[var(--surface)] flex items-center justify-center">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-[var(--muted)]" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={bannerInputRef}
                  onChange={(e) => handleFileSelect(e, "banner")}
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-[var(--surface-soft)] hover:bg-[var(--surface)] px-4 py-2 rounded-lg transition-colors border border-[var(--border)]"
                >
                  <UploadCloud size={14} /> Upload Banner
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-4">About Me</h3>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Bio</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={255}
              rows={3}
              placeholder="Tell us a little bit about yourself..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors resize-none"
            />
            <p className="text-right text-[10px] text-[var(--muted)] mt-1">{formData.bio.length} / 255</p>
          </div>
        </div>

        {/* Academics */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-4">Academic Details</h3>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Research Interests (Comma separated)</label>
            <input 
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="e.g. Organic Synthesis, Quantum Mechanics"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Preferred Subjects (Comma separated)</label>
            <input 
              name="subjects"
              value={formData.subjects}
              onChange={handleChange}
              placeholder="e.g. CY1010, Physical Chemistry"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {success && <span className="flex items-center gap-2 text-sm font-bold text-emerald-400"><CheckCircle2 size={16} /> Saved Successfully</span>}
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
