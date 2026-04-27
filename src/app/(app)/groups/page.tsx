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
        supabase.from<Room>("rooms").select("*").eq("is_public", true).neq("id", "global").order("created_at", { ascending: false }),
        supabase.from<RoomMember>("room_members").select("room_id").eq("user_id", profile.id),
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
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

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

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <PageHeader
        title="Study Circles"
        description="Join topic-focused group spaces with synced live chat and simple coordination."
        profile={profile}
        action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"><Plus size={14} /> Create</button>}
      />

      <InlineAlert message={error} />
      {loading ? <LoadingCard title="Loading groups..." /> : null}

      {myGroups.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">My groups</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {myGroups.map((room) => (
              <Link key={room.id} href={`/groups/${room.id}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3 hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-slate-700 p-2 text-slate-300"><Users2 size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{room.name}</p>
                    <p className="text-xs text-slate-500">{room.location || "Public group"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {room.created_by === profile.id ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        void handleDeleteRoom(room.id);
                      }}
                      className="rounded p-1.5 text-slate-500 hover:bg-rose-950/30 hover:text-rose-300"
                      title="Delete group"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                  <ArrowRight size={15} className="text-slate-500" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {discover.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Discover</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {discover.map((room) => (
              <div key={room.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg border border-slate-700 p-2 text-slate-300"><Users2 size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{room.name}</p>
                    <p className="text-xs text-slate-500">{room.location || "Public group"}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const { error: joinError } = await supabase.from<RoomMember>("room_members").insert({ room_id: room.id, user_id: profile.id });
                    if (joinError) setError(joinError.message);
                    else setJoined((current) => new Set([...current, room.id]));
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-600"
                >
                  Join group
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !myGroups.length && !discover.length ? <EmptyState title="No groups yet" description="Create one and invite peers." /> : null}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">Create a group</h2>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!profile) return;
                setCreating(true);
                setError(null);
                const { data, error: insertError } = await supabase.from<Room>("rooms").insert({
                  id: slugify(newGroupName),
                  name: newGroupName,
                  location: newLocation.trim() || null,
                  contact_info: newContactInfo.trim() || null,
                  invited_people: newInvitedPeople.trim() || null,
                  created_by: profile.id,
                  is_public: true,
                });

                if (insertError) {
                  setError(insertError.message);
                } else {
                  const inserted = Array.isArray(data) ? (data[0] as Room | undefined) : undefined;
                  if (inserted) {
                    setPublicRooms((current) => [inserted, ...current]);
                    setJoined((current) => new Set([...current, inserted.id]));
                    await supabase.from<RoomMember>("room_members").insert({ room_id: inserted.id, user_id: profile.id });
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
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name *" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none" required />
              <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none" />
              <input value={newContactInfo} onChange={(e) => setNewContactInfo(e.target.value)} placeholder="Contact info" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none" />
              <input value={newInvitedPeople} onChange={(e) => setNewInvitedPeople(e.target.value)} placeholder="Invited members" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="w-full rounded-xl border border-slate-700 py-2 text-sm text-slate-300">Cancel</button>
                <button type="submit" disabled={creating} className="w-full rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60">{creating ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
