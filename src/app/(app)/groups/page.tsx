"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users2, Activity, MessageSquare, Mail, Compass, Star, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { Room } from "@/lib/types";
import { slugify, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function SynergyGroupsPage() {
  const { profile } = useAuth();
  const [publicRooms, setPublicRooms] = useState<(Room & { memberCount: number, category: string })[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newContactInfo, setNewContactInfo] = useState("");
  const [newInvitedPeople, setNewInvitedPeople] = useState("");
  const [creating, setCreating] = useState(false);

  const [activeTab, setActiveTab] = useState<"trending" | "recommended">("trending");

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    const load = async () => {
      const [{ data: rooms }, { data: members }] = await Promise.all([
        supabase.from("rooms").select("*, room_members(count)").eq("is_public", true).neq("id", "global").order("created_at", { ascending: false }),
        supabase.from("room_members").select("room_id").eq("user_id", profile.id),
      ]);
      
      const parsedRooms = (Array.isArray(rooms) ? rooms : []).map(r => ({
        ...r,
        memberCount: r.room_members && r.room_members[0] ? r.room_members[0].count : 0,
        category: r.location || "General"
      }));

      setPublicRooms(parsedRooms);
      setJoined(new Set((Array.isArray(members) ? members : []).map((m) => m.room_id)));
      setLoading(false);
    };
    void load();
  }, [profile]);

  const handleDeleteRoom = async (roomId: string) => {
    if (!profile?.id) return;
    if (!window.confirm("Delete this group and all related messages?")) return;

    const { error: deleteError } = await supabase.from("rooms").delete().eq("id", roomId).eq("created_by", profile.id);
    if (deleteError) { setError(deleteError.message); return; }

    setPublicRooms((current) => current.filter((r) => r.id !== roomId));
    setJoined((current) => {
      const next = new Set(current);
      next.delete(roomId);
      return next;
    });
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!profile) return;
    const { error: joinError } = await supabase.from("room_members").insert({ room_id: roomId, user_id: profile.id });
    if (joinError) setError(joinError.message);
    else setJoined((current) => new Set([...current, roomId]));
  };

  const myGroups = useMemo(() => publicRooms.filter((room) => joined.has(room.id)), [publicRooms, joined]);
  
  const discoverRooms = useMemo(() => {
    return publicRooms.filter((room) => !joined.has(room.id));
  }, [publicRooms, joined]);

  const sortedDiscover = useMemo(() => {
    const list = [...discoverRooms];
    if (activeTab === "recommended") return list.sort((a,b) => b.memberCount - a.memberCount);
    // Trending could just be creation date since we removed fake activity score
    return list.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [discoverRooms, activeTab]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Synergy Groups locked" description="Only active users can discover and join groups." />;

  const inputClasses = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

  return (
    <div className="pb-12">
      <PageHeader
        title="Study Circles"
        description="Discover topics, connect with peers, and collaborate in dedicated community spaces."
        profile={profile}
        action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#bce600] active:scale-[0.98]"><Plus size={16} /> Create Community</button>}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Content Area */}
        <div className="flex flex-col gap-8 min-w-0">
          <InlineAlert message={error} tone="error" />
          {loading && <LoadingCard title="Loading communities..." />}

          {/* My Communities Section */}
          {!loading && myGroups.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
                <Users2 size={20} className="text-[var(--accent)]" /> My Communities
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {myGroups.map((room) => (
                  <CommunityCard 
                    key={room.id} 
                    room={room} 
                    isJoined={true} 
                    isCreator={room.created_by === profile.id}
                    onDelete={() => handleDeleteRoom(room.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Discover Section */}
          {!loading && discoverRooms.length > 0 && (
            <section>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass size={20} className="text-blue-400" /> Discover Communities
                </h2>
                
                {/* Tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-[var(--surface-soft)] p-1">
                  <TabButton active={activeTab === "trending"} onClick={() => setActiveTab("trending")} icon={<Activity size={14}/>} label="Newest" />
                  <TabButton active={activeTab === "recommended"} onClick={() => setActiveTab("recommended")} icon={<Star size={14}/>} label="Recommended" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {sortedDiscover.map((room) => (
                  <CommunityCard 
                    key={room.id} 
                    room={room} 
                    isJoined={false} 
                    onJoin={() => handleJoinRoom(room.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && !myGroups.length && !discoverRooms.length ? (
            <EmptyState title="No communities yet" description="Be the first to create a space and invite your peers." />
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Network Stats */}



          {/* Network Stats */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <Activity size={16} /> Network Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{publicRooms.length}</p>
                <p className="text-xs font-medium text-[var(--muted)]">Active Groups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--accent)]">{publicRooms.reduce((acc, room) => acc + (room.memberCount || 0), 0)}</p>
                <p className="text-xs font-medium text-[var(--muted)]">Total Members</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/50">
            <h2 className="mb-6 text-xl font-bold text-white">Create Community</h2>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!profile) return;
                setCreating(true);
                setError(null);
                const { data, error: insertError } = await supabase.from("rooms").insert({
                  id: slugify(newGroupName),
                  name: newGroupName,
                  location: newLocation.trim() || null,
                  contact_info: newContactInfo.trim() || null,
                  invited_people: newInvitedPeople.trim() || null,
                  created_by: profile.id,
                  is_public: true,
                }).select();

                if (insertError) {
                  setError(insertError.message);
                } else {
                  const inserted = Array.isArray(data) ? (data[0] as Room | undefined) : undefined;
                  if (inserted) {
                    setPublicRooms((current) => [inserted, ...current]);
                    setJoined((current) => new Set([...current, inserted.id]));
                    await supabase.from("room_members").insert({ room_id: inserted.id, user_id: profile.id });
                  }
                  setShowCreate(false);
                  setNewGroupName("");
                  setNewLocation("");
                  setNewContactInfo("");
                  setNewInvitedPeople("");
                }
                setCreating(false);
              }}
              className="space-y-3"
            >
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Community name *" className={inputClasses} required />
              <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Category / Subject" className={inputClasses} />
              <textarea value={newContactInfo} onChange={(e) => setNewContactInfo(e.target.value)} placeholder="Short description" className={`${inputClasses} h-20 resize-none`} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="w-full rounded-lg border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-white">Cancel</button>
                <button type="submit" disabled={creating} className="w-full rounded-lg border border-[var(--accent)] bg-[var(--accent)] py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#bce600] disabled:opacity-60 active:scale-[0.98]">{creating ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
        active ? "bg-[var(--background)] text-white shadow-sm border border-[var(--border)]" : "text-[var(--muted)] hover:text-white hover:bg-[var(--surface)] border border-transparent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function CommunityCard({ 
  room, 
  isJoined, 
  isCreator,
  onJoin, 
  onDelete 
}: { 
  room: Room & { memberCount?: number, category?: string }; 
  isJoined: boolean; 
  isCreator?: boolean;
  onJoin?: () => void; 
  onDelete?: () => void;
}) {
  return (
    <div className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-white group-hover:text-[var(--accent)] transition-colors">{room.name}</h3>
          <span className="inline-block mt-1.5 rounded bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{room.category || "General"}</span>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] group-hover:bg-[var(--accent)] group-hover:text-black transition-colors shadow-sm">
          <Users2 size={18} />
        </div>
      </div>
      
      <p className="mb-5 text-sm text-[var(--muted)] line-clamp-2 min-h-[40px]">
        {room.contact_info || room.description || "A dedicated space for academic collaboration, sharing resources, and discussions."}
      </p>

      <div className="mb-5 flex items-center gap-4 text-xs font-bold text-[var(--muted)]">
        <div className="flex items-center gap-1.5"><Users2 size={14} className="text-white"/> {room.memberCount || 0} Members</div>
      </div>

      <div className="mt-auto flex items-center justify-end border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-2">
          {isCreator && onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(); }}
              className="rounded-lg p-1.5 text-[var(--muted)] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              title="Delete Community"
            >
              <Trash2 size={16} />
            </button>
          )}

          {isJoined ? (
            <Link href={`/groups/${room.id}`} className="rounded-lg bg-[var(--background)] border border-[var(--border)] px-5 py-1.5 text-xs font-bold text-white hover:bg-[var(--surface-soft)] hover:border-[var(--muted)] transition-all active:scale-[0.98]">
              Enter
            </Link>
          ) : (
            <button onClick={onJoin} className="rounded-lg bg-[var(--accent)] px-5 py-1.5 text-xs font-bold text-black hover:bg-[#bce600] transition-all active:scale-[0.98]">
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
