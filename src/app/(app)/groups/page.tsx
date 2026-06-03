"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus, Trash2, Users2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { Room, RoomMember } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function SynergyGroupsPage() {
  const { profile } = useAuth();
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newContactInfo, setNewContactInfo] = useState("");
  const [newInvitedPeople, setNewInvitedPeople] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    const load = async () => {
      const [{ data: rooms }, { data: members }] = await Promise.all([
        supabase.from("rooms").select("*").eq("is_public", true).neq("id", "global").order("created_at", { ascending: false }),
        supabase.from("room_members").select("room_id").eq("user_id", profile.id),
      ]);
      setPublicRooms(Array.isArray(rooms) ? rooms : []);
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

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Synergy Groups locked" description="Only active users can discover and join groups." />;

  const myGroups = publicRooms.filter((room) => joined.has(room.id));
  const discover = publicRooms.filter((room) => !joined.has(room.id));

  const inputClasses = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <PageHeader
        title="Study Circles"
        description="Join topic-focused group spaces with synced live chat and simple coordination."
        profile={profile}
        action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#bce600]"><Plus size={16} /> Create Group</button>}
      />

      <InlineAlert message={error} />
      {loading ? <LoadingCard title="Loading groups..." /> : null}

      {myGroups.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">My Groups</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {myGroups.map((room) => (
              <Link key={room.id} href={`/groups/${room.id}`} className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="rounded-full border border-[var(--border)] bg-[var(--background)] p-2.5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors"><Users2 size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-white">{room.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">{room.location || "Public group"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {room.created_by === profile.id ? (
                    <button
                      onClick={(e) => { e.preventDefault(); void handleDeleteRoom(room.id); }}
                      className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Delete group"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                  <ArrowRight size={18} className="text-[var(--muted)] transition-colors group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {discover.length > 0 ? (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Discover</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {discover.map((room) => (
              <div key={room.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-4">
                  <div className="rounded-full border border-[var(--border)] bg-[var(--background)] p-2.5 text-[var(--muted)]"><Users2 size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-white">{room.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">{room.location || "Public group"}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const { error: joinError } = await supabase.from("room_members").insert({ room_id: room.id, user_id: profile.id });
                    if (joinError) setError(joinError.message);
                    else setJoined((current) => new Set([...current, room.id]));
                  }}
                  className="w-full rounded-lg border border-[var(--accent)] bg-transparent px-4 py-2 text-sm font-bold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-black"
                >
                  Join Group
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !myGroups.length && !discover.length ? <EmptyState title="No groups yet" description="Create one and invite peers." /> : null}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-white">Create Group</h2>
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
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name *" className={inputClasses} required />
              <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location" className={inputClasses} />
              <input value={newContactInfo} onChange={(e) => setNewContactInfo(e.target.value)} placeholder="Contact info" className={inputClasses} />
              <input value={newInvitedPeople} onChange={(e) => setNewInvitedPeople(e.target.value)} placeholder="Invited members" className={inputClasses} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="w-full rounded-lg border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-white">Cancel</button>
                <button type="submit" disabled={creating} className="w-full rounded-lg border border-[var(--accent)] bg-[var(--accent)] py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#bce600] disabled:opacity-60">{creating ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
