import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Save, CheckCircle2 } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function PersonalTab({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const supabase = createClientComponentClient();
  
  const [formData, setFormData] = useState({
    name: profile.name || "",
    batch_year: profile.batch_year || "",
    bio: profile.bio || "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = {
        name: formData.name,
        batch_year: parseInt(formData.batch_year as string) || profile.batch_year,
        bio: formData.bio,
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, ...updates });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update personal info");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Personal Information</h2>
        <p className="text-sm text-[var(--muted)]">Update your basic identity and biography details.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Full Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Roll Number <span className="text-[10px] text-red-400 ml-1">(Read Only)</span></label>
              <input 
                value={profile.roll_no}
                disabled
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Batch Year</label>
              <input 
                name="batch_year"
                type="number"
                value={formData.batch_year}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Programme</label>
              <input 
                value={profile.programme}
                disabled
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 block">Biography</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={255}
              rows={4}
              placeholder="Tell us a little bit about yourself..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors resize-none"
            />
            <p className="text-right text-[10px] text-[var(--muted)] mt-1">{formData.bio.length} / 255</p>
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
