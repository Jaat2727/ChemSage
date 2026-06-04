import { useState, KeyboardEvent } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Save, CheckCircle2, X, Plus } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function AcademicTab({ profile, setProfile, isOwner }: { profile: Profile; setProfile: (p: Profile) => void, isOwner: boolean }) {
  const supabase = createClientComponentClient();
  
  const [interests, setInterests] = useState<string[]>(profile.academic_interests || []);
  const [subjects, setSubjects] = useState<string[]>(profile.preferred_subjects || []);
  
  const [interestInput, setInterestInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChip = (e: KeyboardEvent<HTMLInputElement> | React.MouseEvent, type: 'interests' | 'subjects') => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    
    setSuccess(false);
    
    if (type === 'interests' && interestInput.trim()) {
      if (!interests.includes(interestInput.trim())) {
        setInterests([...interests, interestInput.trim()]);
      }
      setInterestInput("");
    } else if (type === 'subjects' && subjectInput.trim()) {
      if (!subjects.includes(subjectInput.trim())) {
        setSubjects([...subjects, subjectInput.trim()]);
      }
      setSubjectInput("");
    }
  };

  const removeChip = (index: number, type: 'interests' | 'subjects') => {
    setSuccess(false);
    if (type === 'interests') {
      setInterests(interests.filter((_, i) => i !== index));
    } else {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = {
        academic_interests: interests,
        preferred_subjects: subjects,
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
      setError(err.message || "Failed to update academic profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Academic Identity</h2>
        <p className="text-sm text-[var(--muted)]">Manage your research interests and preferred coursework.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Research Interests */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h3 className="text-sm font-bold text-white mb-4">Research Interests</h3>
          
          {isOwner && (
            <div className="flex items-center gap-2 mb-4">
              <input 
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => addChip(e, 'interests')}
                placeholder="Type an interest and press Enter (e.g. Organic Synthesis)"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
              />
              <button 
                type="button"
                onClick={(e) => addChip(e, 'interests')}
                className="p-2.5 rounded-lg bg-[var(--surface-soft)] text-white hover:bg-[var(--surface)] transition-colors border border-[var(--border)]"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {interests.length === 0 ? (
              <span className="text-sm text-[var(--muted)]">No research interests listed.</span>
            ) : (
              interests.map((interest, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-full bg-[var(--surface-soft)] pl-3 pr-1.5 py-1 text-xs font-medium text-white border border-[var(--border)]">
                  {interest}
                  {isOwner && (
                    <button 
                      type="button" 
                      onClick={() => removeChip(i, 'interests')}
                      className="rounded-full p-0.5 hover:bg-[var(--background)] text-[var(--muted)] hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preferred Subjects */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h3 className="text-sm font-bold text-white mb-4">Preferred Subjects</h3>
          
          {isOwner && (
            <div className="flex items-center gap-2 mb-4">
              <input 
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => addChip(e, 'subjects')}
                placeholder="Type a subject code and press Enter (e.g. CY1010)"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white focus:border-[var(--accent)] outline-none transition-colors"
              />
              <button 
                type="button"
                onClick={(e) => addChip(e, 'subjects')}
                className="p-2.5 rounded-lg bg-[var(--surface-soft)] text-white hover:bg-[var(--surface)] transition-colors border border-[var(--border)]"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {subjects.length === 0 ? (
              <span className="text-sm text-[var(--muted)]">No preferred subjects listed.</span>
            ) : (
              subjects.map((subject, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-full bg-[var(--surface-soft)] pl-3 pr-1.5 py-1 text-xs font-medium text-white border border-[var(--border)]">
                  {subject}
                  {isOwner && (
                    <button 
                      type="button" 
                      onClick={() => removeChip(i, 'subjects')}
                      className="rounded-full p-0.5 hover:bg-[var(--background)] text-[var(--muted)] hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {isOwner && (
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
        )}
      </form>
    </div>
  );
}
