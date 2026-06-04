"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  User, LayoutDashboard, Fingerprint, Image as ImageIcon, 
  Activity, ShieldCheck, ChevronLeft 
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/PageHeader";
import type { Profile } from "@/lib/types";

// Import sections
import OverviewTab from "./components/OverviewTab";
import PersonalTab from "./components/PersonalTab";
import AcademicTab from "./components/AcademicTab";
import MediaTab from "./components/MediaTab";
import ActivityTab from "./components/ActivityTab";
import SecurityTab from "./components/SecurityTab";

type Tab = "Overview" | "Personal" | "Academic" | "Media" | "Activity" | "Security";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: currentUser } = useAuth();
  const supabase = createClientComponentClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const isOwner = currentUser?.id === userId;

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

  // Define tabs based on ownership
  const ALL_TABS: { id: Tab; icon: any; label: string; ownerOnly: boolean }[] = [
    { id: "Overview", icon: LayoutDashboard, label: "Overview", ownerOnly: false },
    { id: "Personal", icon: User, label: "Personal Info", ownerOnly: true },
    { id: "Academic", icon: Fingerprint, label: "Academic Identity", ownerOnly: false },
    { id: "Media", icon: ImageIcon, label: "Media Assets", ownerOnly: true },
    { id: "Activity", icon: Activity, label: "Activity Feed", ownerOnly: false },
    { id: "Security", icon: ShieldCheck, label: "Security", ownerOnly: true },
  ];

  const visibleTabs = ALL_TABS.filter(tab => isOwner || !tab.ownerOnly);

  return (
    <div className="mx-auto max-w-[1400px] pb-12">
      <Link href="/hub/global" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-white transition-colors">
        <ChevronLeft size={16} />
        Back to Community
      </Link>

      <PageHeader 
        title={isOwner ? "Account Management" : `${profile.name}'s Profile`}
        description={isOwner ? "Manage your identity and preferences on ChemSAGE." : `Viewing public profile information.`}
        profile={profile}
      />

      <div className="mt-8 flex flex-col items-start gap-8 lg:flex-row">
        
        {/* Sidebar Nav */}
        <div className="w-full shrink-0 lg:w-64">
          <nav className="flex flex-row overflow-x-auto pb-4 lg:flex-col lg:overflow-visible lg:pb-0 gap-1 scrollbar-hide">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex w-full min-w-max items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive 
                      ? "bg-[var(--accent)] text-black shadow-sm" 
                      : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-black" : "text-[var(--muted)] group-hover:text-white"} />
                  {tab.label}
                  {isActive && (
                    <span className="absolute -left-2 top-1/2 hidden h-4 w-1 -translate-y-1/2 rounded-full bg-[var(--accent)] lg:block" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <div className="animate-fade-in">
            {activeTab === "Overview" && <OverviewTab profile={profile} isOwner={isOwner} />}
            {activeTab === "Personal" && isOwner && <PersonalTab profile={profile} setProfile={setProfile} />}
            {activeTab === "Academic" && <AcademicTab profile={profile} setProfile={setProfile} isOwner={isOwner} />}
            {activeTab === "Media" && isOwner && <MediaTab profile={profile} setProfile={setProfile} />}
            {activeTab === "Activity" && <ActivityTab profile={profile} />}
            {activeTab === "Security" && isOwner && <SecurityTab profile={profile} />}
          </div>
        </div>

      </div>
    </div>
  );
}
