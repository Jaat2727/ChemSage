"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users2, Activity, Compass, Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
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
  const discoverRooms = useMemo(() => publicRooms.filter((room) => !joined.has(room.id)), [publicRooms, joined]);

  const sortedDiscover = useMemo(() => {
    const list = [...discoverRooms];
    if (activeTab === "recommended") return list.sort((a,b) => b.memberCount - a.memberCount);
    return list.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [discoverRooms, activeTab]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Synergy Groups locked" description="Only active users can discover and join groups." />;

  return (
    <div>
      <PageHeader
        title="Study Circles"
        description="Discover topics, connect with peers, and collaborate in dedicated community spaces."
        profile={profile}
        action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-[0.8125rem] font-bold text-black transition-colors hover:bg-[var(--accent-hover)] active:scale-[0.98]"><Plus size={16} /> Create Community</button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_var(--panel-width)]">
        {/* Main Content Area */}
        <div className="flex flex-col gap-6 min-w-0">
          <InlineAlert message={error} tone="error" />
          {loading && <LoadingCard title="Loading communities..." />}

          {/* My Communities */}
          {!loading && myGroups.length > 0 && (
            <section>
              <SectionHeader title="My Communities" icon={Users2} iconColor="text-[var(--accent)]" />
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

          {/* Discover */}
          {!loading && discoverRooms.length > 0 && (
            <section>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                <h2 className="text-h2 flex items-center gap-2">
                  <Compass size={18} className="text-[var(--info)]" /> Discover Communities
                </h2>
                <div className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-1">
                  <TabButton active={activeTab === "trending"} onClick={() => setActiveTab("trending")} icon={<Activity size={13}/>} label="Newest" />
                  <TabButton active={activeTab === "recommended"} onClick={() => setActiveTab("recommended")} icon={<Star size={13}/>} label="Recommended" />
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
        <aside className="flex flex-col gap-4">
          <Card>
            <SectionHeader title="Network Stats" icon={Activity} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-h1 text-[var(--fg-default)]">{publicRooms.length}</p>
                <p className="text-caption">Active Groups</p>
              </div>
              <div>
                <p className="text-h1 text-[var(--accent)]">{publicRooms.reduce((acc, room) => acc + (room.memberCount || 0), 0)}</p>
                <p className="text-caption">Total Members</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* Create Community Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Community" maxWidth="md">
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
                const parsedRoom = { ...inserted, memberCount: 1, category: inserted.location || "General" };
                setPublicRooms((current) => [parsedRoom, ...current]);
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
          <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Community name *" required />
          <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Category / Subject" />
          <Textarea value={newContactInfo} onChange={(e) => setNewContactInfo(e.target.value)} placeholder="Short description" className="h-20" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] py-2.5 text-[0.8125rem] font-bold text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)]">Cancel</button>
            <button type="submit" disabled={creating} className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] py-2.5 text-[0.8125rem] font-bold text-black transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60 active:scale-[0.98]">{creating ? "Creating..." : "Create"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-caption font-bold transition-all",
        active ? "bg-[var(--bg-base)] text-[var(--fg-default)] shadow-sm border border-[var(--border-default)]" : "text-[var(--fg-faint)] hover:text-[var(--fg-default)] border border-transparent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function CommunityCard({ 
  room, isJoined, isCreator, onJoin, onDelete 
}: { 
  room: Room & { memberCount?: number, category?: string }; 
  isJoined: boolean; 
  isCreator?: boolean;
  onJoin?: () => void; 
  onDelete?: () => void;
}) {
  return (
    <Card hover className="group flex flex-col">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-h2 truncate group-hover:text-[var(--accent)] transition-colors">{room.name}</h3>
          <Badge variant="neutral" className="mt-1.5">{room.category || "General"}</Badge>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--fg-faint)] group-hover:bg-[var(--accent)] group-hover:text-black transition-colors">
          <Users2 size={16} />
        </div>
      </div>
      
      <p className="text-body mb-4 line-clamp-2 min-h-[36px]">
        {room.contact_info || room.description || "A dedicated space for academic collaboration, sharing resources, and discussions."}
      </p>

      <div className="mb-4 flex items-center gap-4 text-caption">
        <div className="flex items-center gap-1.5"><Users2 size={13} className="text-[var(--fg-default)]"/> {room.memberCount || 0} Members</div>
      </div>

      <div className="mt-auto flex items-center justify-end border-t border-[var(--border-subtle)] pt-3">
        <div className="flex items-center gap-2">
          {isCreator && onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(); }}
              className="rounded-[var(--radius-md)] p-1.5 text-[var(--fg-faint)] opacity-0 transition-all hover:bg-[var(--error-muted)] hover:text-[var(--error)] group-hover:opacity-100"
              title="Delete Community"
            >
              <Trash2 size={15} />
            </button>
          )}

          {isJoined ? (
            <Link href={`/groups/${room.id}`} className="rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)] px-5 py-1.5 text-caption font-bold text-[var(--fg-default)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] transition-all active:scale-[0.98]">
              Enter
            </Link>
          ) : (
            <button onClick={onJoin} className="rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-1.5 text-caption font-bold text-black hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98]">
              Join
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
