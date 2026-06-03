"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, GraduationCap, Calendar, Mail, ShieldAlert } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";

const supabase = createClientComponentClient();

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (fetchError) {
        if (mounted) setError(fetchError.message);
      } else if (mounted) {
        setUserProfile(data as Profile);
      }
      
      if (mounted) setLoading(false);
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) return <LoadingCard />;
  
  if (error || !userProfile) {
    return <LockedScreen title="Profile Not Found" description="The user profile you are looking for does not exist or you do not have permission to view it." />;
  }

  const initials = userProfile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-3xl pb-12 pt-6">
      <Link href="/hub/global" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-white transition-colors">
        <ArrowLeft size={16} />
        Back to Community Hub
      </Link>
      
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
        {/* Banner */}
        <div className="h-32 w-full bg-gradient-to-r from-[var(--surface-soft)] to-[var(--surface)] relative overflow-hidden">
           <div className="absolute inset-0 bg-[var(--accent)]/5 backdrop-blur-md" />
           <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        </div>
        
        {/* Profile Content */}
        <div className="px-6 sm:px-10 pb-10">
          <div className="relative flex justify-between items-end -mt-16 mb-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-4 border-[var(--background)] bg-[var(--surface)] text-4xl font-bold text-[var(--accent)] shadow-xl relative overflow-hidden">
               {initials}
               <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            </div>
            
            <Link 
              href={`/hub/${userProfile.id}`}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black transition-transform hover:scale-105 hover:bg-[#bce600] shadow-lg shadow-[var(--accent)]/20"
            >
              <MessageSquare size={16} />
              Message
            </Link>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white md:text-4xl">{userProfile.name}</h1>
            <p className="mt-1 text-lg text-[var(--muted)] font-mono">{userProfile.roll_no}</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]/30">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <GraduationCap size={20} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Programme</p>
              <p className="mt-1 font-bold text-white text-lg">{userProfile.programme}</p>
            </div>
            
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]/30">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Calendar size={20} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Batch Year</p>
              <p className="mt-1 font-bold text-white text-lg">{userProfile.batch_year}</p>
            </div>
            
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:col-span-2 flex items-center justify-between transition-colors hover:border-[var(--accent)]/30">
              <div className="flex items-center gap-4">
                 <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${userProfile.status === 'active' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-red-500/10 text-red-400'}`}>
                   {userProfile.status === 'active' ? <Mail size={20} /> : <ShieldAlert size={20} />}
                 </div>
                 <div>
                   <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</p>
                   <p className="mt-1 font-bold text-white capitalize">{userProfile.status}</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="relative flex h-3 w-3">
                    {userProfile.status === 'active' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>}
                    <span className={`relative inline-flex h-3 w-3 rounded-full ${userProfile.status === 'active' ? 'bg-[var(--accent)]' : 'bg-red-500'}`}></span>
                 </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
