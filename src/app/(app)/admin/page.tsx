"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Users, UserPlus, Database, LayoutDashboard, 
  HardDrive, BarChart3, FolderTree, Bell
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { 
  Profile, ResourceItem, ExamPaper, Folder, Room, StarRecord, AdminAuditLog 
} from "@/lib/types";

// Import sections
import OverviewSection from "./components/OverviewSection";
import UsersSection from "./components/UsersSection";
import PendingSection from "./components/PendingSection";
import ContentSection from "./components/ContentSection";
import FolderSection from "./components/FolderSection";
import AnalyticsSection from "./components/AnalyticsSection";
import SystemSection from "./components/SystemSection";

const supabase = createClientComponentClient();

type Tab = 
  | "Overview" 
  | "Users" 
  | "Pending Approvals" 
  | "Content Moderation" 
  | "Folder Manager" 
  | "Analytics" 
  | "System";

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: "Overview", icon: LayoutDashboard, label: "Overview" },
  { id: "Users", icon: Users, label: "Users" },
  { id: "Pending Approvals", icon: UserPlus, label: "Pending Approvals" },
  { id: "Content Moderation", icon: Database, label: "Content Moderation" },
  { id: "Folder Manager", icon: FolderTree, label: "Folder Manager" },
  { id: "Analytics", icon: BarChart3, label: "Analytics" },
  { id: "System", icon: HardDrive, label: "System" },
];

export default function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  
  // Global Admin State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stars, setStars] = useState<StarRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived state
  const pendingUsers = useMemo(() => profiles.filter((p) => p.status === "pending"), [profiles]);

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;
    
    const loadData = async () => {
      const [
        { data: p }, { data: r }, { data: e }, { data: f }, 
        { data: rm }, { data: s }, { data: a }
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("resources").select("*").order("created_at", { ascending: false }),
        supabase.from("exam_papers").select("*").order("created_at", { ascending: false }),
        supabase.from("folders").select("*").order("name"),
        supabase.from("rooms").select("*"),
        supabase.from("stars").select("*"),
        supabase.from("admin_audit_logs").select("*, admin:admin_id(id, name, roll_no)").order("created_at", { ascending: false }).limit(100),
      ]);
      
      setProfiles(Array.isArray(p) ? p : []);
      setResources(Array.isArray(r) ? r : []);
      setPapers(Array.isArray(e) ? e : []);
      setFolders(Array.isArray(f) ? f : []);
      setRooms(Array.isArray(rm) ? rm : []);
      setStars(Array.isArray(s) ? s : []);
      setAuditLogs(Array.isArray(a) ? a : []);
      setLoading(false);
    };
    
    void loadData();
  }, [profile]);

  // Expose a function to refresh audit logs
  const logAdminAction = async (actionType: string, targetType: string, targetId?: string, details?: any) => {
    if (!profile) return;
    const { data } = await supabase.from("admin_audit_logs").insert({
      admin_id: profile.id,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details
    }).select("*, admin:admin_id(id, name, roll_no)").single();
    
    if (data) {
      setAuditLogs(prev => [data as AdminAuditLog, ...prev]);
    }
  };

  if (!profile) return <LoadingCard />;
  if (profile.role !== "admin") return <LockedScreen title="Admin only" description="This section is restricted to administrators." />;
  if (loading) return <LoadingCard title="> loading admin platform..." />;

  const sharedProps = {
    profiles, setProfiles,
    resources, setResources,
    papers, setPapers,
    folders, setFolders,
    rooms, setRooms,
    stars, setStars,
    auditLogs, setAuditLogs,
    logAdminAction,
    profile
  };

  return (
    <div className="mx-auto max-w-[1400px] pb-12">
      <PageHeader 
        title="Admin Platform" 
        description="Central command center for the IITM BS Chemistry workspace." 
        profile={profile} 
      />

      <div className="mt-8 flex flex-col items-start gap-8 lg:flex-row">
        
        {/* Sidebar Nav */}
        <div className="w-full shrink-0 lg:w-64">
          <nav className="flex flex-row overflow-x-auto pb-4 lg:flex-col lg:overflow-visible lg:pb-0 gap-1 scrollbar-hide">
            {TABS.map((tab) => {
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
                  <Icon size={18} className={isActive ? "text-black" : "text-[var(--muted)] group-hover:text-white transition-colors"} />
                  {tab.label}
                  
                  {tab.id === "Pending Approvals" && pendingUsers.length > 0 && (
                    <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      isActive ? "bg-black text-[var(--accent)]" : "bg-[var(--accent)] text-black"
                    }`}>
                      {pendingUsers.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="min-w-0 flex-1 animate-fade-in w-full">
          {activeTab === "Overview" && <OverviewSection {...sharedProps} />}
          {activeTab === "Users" && <UsersSection {...sharedProps} />}
          {activeTab === "Pending Approvals" && <PendingSection {...sharedProps} />}
          {activeTab === "Content Moderation" && <ContentSection {...sharedProps} />}
          {activeTab === "Folder Manager" && <FolderSection {...sharedProps} />}
          {activeTab === "Analytics" && <AnalyticsSection {...sharedProps} />}
          {activeTab === "System" && <SystemSection {...sharedProps} />}
        </div>
      </div>
    </div>
  );
}
