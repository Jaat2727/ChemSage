import { useState, useRef } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Image as ImageIcon, UploadCloud, Trash2, CheckCircle2 } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function MediaTab({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const supabase = createClientComponentClient();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url || null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Client-side image compression and resizing logic
  const processImage = (file: File, width: number, height: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context not available");

          // Calculate cropping to center the image if aspect ratio doesn't match
          const targetRatio = width / height;
          const imgRatio = img.width / img.height;
          
          let drawWidth = img.width;
          let drawHeight = img.height;
          let offsetX = 0;
          let offsetY = 0;

          if (imgRatio > targetRatio) {
            drawWidth = img.height * targetRatio;
            offsetX = (img.width - drawWidth) / 2;
          } else {
            drawHeight = img.width / targetRatio;
            offsetY = (img.height - drawHeight) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject("Failed to compress image");
            },
            "image/webp",
            0.85 // quality
          );
        };
        img.onerror = () => reject("Failed to load image");
      };
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Please select an image under 10MB.");
      return;
    }

    const setSaving = type === 'avatar' ? setSavingAvatar : setSavingBanner;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Process image
      const width = type === 'avatar' ? 512 : 1920;
      const height = type === 'avatar' ? 512 : 600;
      const webpBlob = await processImage(file, width, height);
      
      // We overwrite the exact file for this user
      const fileName = `${profile.id}.webp`;
      const bucket = type === 'avatar' ? 'avatars' : 'banners';

      // 2. Upload to storage (upsert)
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, webpBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) throw uploadError;

      // 3. Get public URL (append timestamp to bust cache locally)
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const urlWithCacheBust = `${data.publicUrl}?t=${new Date().getTime()}`;

      // 4. Update profile record
      const updateField = type === 'avatar' ? { avatar_url: urlWithCacheBust } : { banner_url: urlWithCacheBust };
      const { error: updateError } = await supabase.from('profiles').update(updateField).eq('id', profile.id);
      
      if (updateError) throw updateError;

      // 5. Update UI
      if (type === 'avatar') {
        setAvatarPreview(urlWithCacheBust);
        setProfile({ ...profile, avatar_url: urlWithCacheBust });
      } else {
        setBannerPreview(urlWithCacheBust);
        setProfile({ ...profile, banner_url: urlWithCacheBust });
      }
      
      setSuccess(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully!`);
    } catch (err: any) {
      setError(err.message || "Failed to process image.");
    } finally {
      setSaving(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (type: 'avatar' | 'banner') => {
    setError(null);
    setSuccess(null);
    
    try {
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const fileName = `${profile.id}.webp`;

      // 1. Delete from storage
      await supabase.storage.from(bucket).remove([fileName]);

      // 2. Update profile
      const updateField = type === 'avatar' ? { avatar_url: null } : { banner_url: null };
      const { error: updateError } = await supabase.from('profiles').update(updateField).eq('id', profile.id);
      if (updateError) throw updateError;

      // 3. Update UI
      if (type === 'avatar') {
        setAvatarPreview(null);
        setProfile({ ...profile, avatar_url: undefined });
      } else {
        setBannerPreview(null);
        setProfile({ ...profile, banner_url: undefined });
      }

      setSuccess(`${type === 'avatar' ? 'Avatar' : 'Banner'} removed.`);
    } catch (err: any) {
      setError(err.message || "Failed to delete image.");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Media Assets</h2>
        <p className="text-sm text-[var(--muted)]">Manage your visual identity. Images are automatically optimized and compressed.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 font-medium flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Avatar Section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="text-sm font-bold text-white mb-4">Profile Avatar</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative h-28 w-28 rounded-2xl overflow-hidden border-4 border-[var(--surface-soft)] bg-[var(--background)] flex items-center justify-center shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold text-[var(--accent)]">{profile.name.substring(0,2).toUpperCase()}</span>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-xs text-[var(--muted)]">
              Recommended: Minimum 512x512px. Images will be automatically cropped to a square and converted to WebP.
            </p>
            <div className="flex items-center gap-3">
              <input 
                type="file" accept="image/*" className="hidden" ref={avatarInputRef}
                onChange={(e) => handleUpload(e, 'avatar')}
              />
              <button 
                onClick={() => avatarInputRef.current?.click()}
                disabled={savingAvatar}
                className="flex items-center gap-2 text-xs font-bold text-black bg-[var(--accent)] hover:opacity-90 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingAvatar ? "Processing..." : <><UploadCloud size={14} /> Replace Image</>}
              </button>
              
              {avatarPreview && (
                <button 
                  onClick={() => handleDelete('avatar')}
                  disabled={savingAvatar}
                  className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="text-sm font-bold text-white mb-4">Profile Banner</h3>
        
        <div className="flex flex-col gap-6">
          <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-[var(--surface-soft)] bg-[var(--background)] flex items-center justify-center">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={32} className="text-[var(--muted)]" />
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-xs text-[var(--muted)]">
              Recommended: 1920x600px. Images will be automatically cropped and converted to WebP.
            </p>
            <div className="flex items-center gap-3">
              <input 
                type="file" accept="image/*" className="hidden" ref={bannerInputRef}
                onChange={(e) => handleUpload(e, 'banner')}
              />
              <button 
                onClick={() => bannerInputRef.current?.click()}
                disabled={savingBanner}
                className="flex items-center gap-2 text-xs font-bold text-black bg-[var(--accent)] hover:opacity-90 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingBanner ? "Processing..." : <><UploadCloud size={14} /> Replace Banner</>}
              </button>
              
              {bannerPreview && (
                <button 
                  onClick={() => handleDelete('banner')}
                  disabled={savingBanner}
                  className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
