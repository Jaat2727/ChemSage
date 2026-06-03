"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  User, Database, FileText, Bookmark, Activity, 
  Settings, Shield, ChevronLeft, MapPin
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import type { Profile } from "@/lib/types";

// Import tabs
import OverviewTab from "./components/OverviewTab";
import ActivityTab from "./components/ActivityTab";
import ContentTab from "./components/ContentTab";
import BookmarksTab from "./components/BookmarksTab";
import SettingsTab from "./components/SettingsTab";
import AdminTab from "./components/AdminTab";

type Tab = "Overview" | "Activity" | "Resources" | "Papers" | "Bookmarks" | "Settings" | "Admin";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: currentUser } = useAuth();
  const supabase = createClientComponentClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const isOwner = currentUser?.id === userId;
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (mounted) {
        if (!error && data) setProfile(data as Profile);
        setLoading(false);
      }
    };

    void fetchProfile();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return <LoadingCard title="> loading profile..." />;
  if (!profile) return <LockedScreen title="Profile Not Found" description="This user does not exist or you lack permission to view." />;

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let score = 0;
    const fields = [
      profile.avatar_url,
      profile.banner_url,
      profile.bio,
      profile.academic_interests?.length,
      profile.preferred_subjects?.length
    ];
    fields.forEach(f => { if (f) score += 20; });
    return score;
  };
  const completion = calculateCompletion();

  const TABS = [
    { id: "Overview", icon: User, label: "Overview" },
    { id: "Activity", icon: Activity, label: "Activity" },
    { id: "Resources", icon: Database, label: "Resources" },
    { id: "Papers", icon: FileText, label: "Past Papers" },
    { id: "Bookmarks", icon: Bookmark, label: "Saved" },
    ...(isOwner ? [{ id: "Settings", icon: Settings, label: "Settings" }] : []),
    ...(isAdmin ? [{ id: "Admin", icon: Shield, label: "Moderation" }] : []),
  ] as const;

  const initials = profile.name.substring(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      <Link href="/hub/global" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-white transition-colors">
        <ChevronLeft size={16} />
        Back to Community
      </Link>

      {/* Header Profile Card */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {/* Banner */}
        <div 
          className="h-40 w-full bg-[var(--surface-soft)] relative overflow-hidden bg-cover bg-center"
          style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}
        >
          {!profile.banner_url && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/10 to-transparent backdrop-blur-3xl" />
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[var(--accent)]/20 blur-3xl" />
            </>
          )}
        </div>

        <div className="px-6 pb-6 sm:px-8">
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-12">
            <div className="flex items-end gap-6">
              {/* Avatar */}
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[var(--surface)] bg-[var(--background)] shadow-xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-extrabold text-[var(--accent)]">{initials}</span>
                )}
              </div>
              
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{profile.name}</h1>
                <p className="text-sm font-mono text-[var(--muted)] mt-1">{profile.roll_no} • {profile.programme} '{profile.batch_year.toString().slice(2)}</p>
              </div>
            </div>

            {/* Profile Completion / Badges */}
            {isOwner && (
              <div className="flex flex-col items-end gap-2 bg-[var(--background)] p-3 rounded-xl border border-[var(--border)]">
                <div className="flex justify-between w-full gap-4 text-xs font-bold text-white">
                  <span>Profile Setup</span>
                  <span className="text-[var(--accent)]">{completion}%</span>
                </div>
                <div className="h-1.5 w-40 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${completion}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Bio & Details */}
          <div className="mt-6 max-w-2xl">
            <p className="text-sm leading-relaxed text-gray-300">
              {profile.bio || (isOwner ? "Add a bio in Settings to tell the community about yourself." : "No bio provided.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[var(--muted)]">
              <span className="flex items-center gap-1.5"><User size={14} /> {profile.role === "admin" ? "Administrator" : "Student"}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} /> IIT Madras BS Chemistry</span>
              <span className="flex items-center gap-1.5"><Activity size={14} /> Joined {new Date(profile.created_at || "").getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-10 -mx-4 mb-8 overflow-x-auto bg-[var(--background)] px-4 py-2 sm:mx-0 sm:px-0">
        <nav className="flex gap-2 min-w-max border-b border-[var(--border)] pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
                  isActive 
                    ? "border-[var(--accent)] text-white" 
                    : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:text-gray-300"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[var(--accent)]" : ""} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "Overview" && <OverviewTab profile={profile} />}
        {activeTab === "Activity" && <ActivityTab profile={profile} />}
        {activeTab === "Resources" && <ContentTab profile={profile} type="resource" isOwner={isOwner} isAdmin={isAdmin} />}
        {activeTab === "Papers" && <ContentTab profile={profile} type="paper" isOwner={isOwner} isAdmin={isAdmin} />}
        {activeTab === "Bookmarks" && <BookmarksTab profile={profile} />}
        {activeTab === "Settings" && isOwner && <SettingsTab profile={profile} setProfile={setProfile} />}
        {activeTab === "Admin" && isAdmin && <AdminTab profile={profile} />}
      </div>
    </div>
  );
}
