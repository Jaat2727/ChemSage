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

  const inputClasses = "w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <PageHeader
        title="Study Circles"
        description="Join topic-focused group spaces with synced live chat and simple coordination."
        profile={profile}
        action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 font-mono text-sm font-bold text-black"><Plus size={14} /> create()</button>}
      />

      <InlineAlert message={error} />
      {loading ? <LoadingCard title="> loading groups..." /> : null}

      {myGroups.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 font-mono text-sm font-bold text-[var(--muted)]">{`> my_groups`}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {myGroups.map((room) => (
              <Link key={room.id} href={`/groups/${room.id}`} className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] p-3 transition-all hover:border-[var(--accent)]">
                <div className="flex items-center gap-3">
                  <div className="border border-[var(--border)] p-2 text-[var(--muted)]"><Users2 size={16} /></div>
                  <div>
                    <p className="font-mono text-sm font-bold text-white">{room.name}</p>
                    <p className="font-mono text-xs text-[var(--muted)]">{room.location || "Public group"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {room.created_by === profile.id ? (
                    <button
                      onClick={(e) => { e.preventDefault(); void handleDeleteRoom(room.id); }}
                      className="p-1.5 text-[var(--muted)] transition-colors hover:text-red-400"
                      title="Delete group"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                  <ArrowRight size={15} className="text-[var(--muted)]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {discover.length > 0 ? (
        <section>
          <h2 className="mb-3 font-mono text-sm font-bold text-[var(--muted)]">{`> discover`}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {discover.map((room) => (
              <div key={room.id} className="border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="border border-[var(--border)] p-2 text-[var(--muted)]"><Users2 size={16} /></div>
                  <div>
                    <p className="font-mono text-sm font-bold text-white">{room.name}</p>
                    <p className="font-mono text-xs text-[var(--muted)]">{room.location || "Public group"}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const { error: joinError } = await supabase.from("room_members").insert({ room_id: room.id, user_id: profile.id });
                    if (joinError) setError(joinError.message);
                    else setJoined((current) => new Set([...current, room.id]));
                  }}
                  className="w-full border border-[var(--accent)] bg-transparent px-3 py-2 font-mono text-sm text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-black"
                >
                  join()
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !myGroups.length && !discover.length ? <EmptyState title="No groups yet" description="Create one and invite peers." /> : null}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md border border-[var(--border)] bg-[var(--background)] p-5">
            <h2 className="mb-4 font-mono text-lg font-bold text-white">{`> create_group`}</h2>
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
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="w-full border border-[var(--border)] py-2 font-mono text-sm text-[var(--muted)] hover:text-white">cancel()</button>
                <button type="submit" disabled={creating} className="w-full border border-[var(--accent)] bg-[var(--accent)] py-2 font-mono text-sm font-bold text-black disabled:opacity-60">{creating ? "creating..." : "create()"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
