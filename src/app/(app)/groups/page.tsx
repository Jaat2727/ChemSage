"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Phone, Plus, UserPlus, Users2 } from "lucide-react";
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
        supabase.from<Room>("rooms").select("*").eq("is_public", true).order("created_at", { ascending: false }),
        supabase.from<RoomMember>("room_members").select("room_id").eq("user_id", profile.id),
      ]);
      setPublicRooms(Array.isArray(rooms) ? rooms : []);
      setJoined(new Set((Array.isArray(members) ? members : []).map((m) => m.room_id)));
      setLoading(false);
    };
    void load();
  }, [profile]);

  const myGroups = publicRooms.filter((room) => joined.has(room.id));
  const discover = publicRooms.filter((room) => !joined.has(room.id));

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Synergy Groups locked" description="Only active users can discover and join groups." />;

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <PageHeader title="Synergy Groups" description="Join topic-based rooms, each backed by a Supabase room row and associated messages." profile={profile} action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-all hover:from-pink-600 hover:to-rose-700 active:scale-[0.97]"><Plus size={16} /> Create group</button>} />

      <InlineAlert message={error} />

      {loading ? <LoadingCard title="Loading groups..." /> : null}

      {/* My Groups */}
      {myGroups.length > 0 ? (
        <section className="mb-10 animate-slide-up">
          <h2 className="mb-4 text-lg font-bold text-white">My Groups</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myGroups.map((room) => (
              <Link key={room.id} href={`/groups/${room.id}`} className="group flex animate-fade-in items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700/50 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-pink-950/10">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/15 to-rose-500/15 text-pink-400">
                    <Users2 size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{room.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-slate-400">
                      {room.location && <span className="flex items-center gap-1"><MapPin size={10} />{room.location}</span>}
                      {room.contact_info && <span className="flex items-center gap-1"><Phone size={10} />{room.contact_info}</span>}
                      {room.invited_people && <span className="flex items-center gap-1"><UserPlus size={10} />{room.invited_people}</span>}
                      {!room.location && !room.contact_info && !room.invited_people && <span>Public room</span>}
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="shrink-0 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-pink-400" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Discover */}
      {discover.length > 0 ? (
        <section className="animate-slide-up delay-100">
          <h2 className="mb-4 text-lg font-bold text-white">Discover</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {discover.map((room) => (
              <div key={room.id} className="group animate-fade-in rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/50 hover:bg-slate-900/60">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/15 to-rose-500/15 text-pink-400">
                    <Users2 size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{room.name}</h3>
                    <div className="mt-1 flex flex-col gap-1 text-[11px] font-medium text-slate-400">
                      {room.location && <span className="flex items-center gap-1.5"><MapPin size={10} />{room.location}</span>}
                      {room.contact_info && <span className="flex items-center gap-1.5"><Phone size={10} />{room.contact_info}</span>}
                      {room.invited_people && <span className="flex items-center gap-1.5"><UserPlus size={10} />{room.invited_people}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={async () => {
                  const { error: joinError } = await supabase.from<RoomMember>("room_members").insert({ room_id: room.id, user_id: profile.id });
                  if (joinError) setError(joinError.message);
                  else setJoined((current) => new Set([...current, room.id]));
                }} className="w-full rounded-xl bg-pink-500/10 px-4 py-2.5 text-sm font-semibold text-pink-300 transition-all hover:bg-pink-500/20">
                  Join group
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : !loading && !myGroups.length ? (
        <EmptyState title="No groups yet" description="Be the first to create a study group and invite your peers." />
      ) : null}

      {/* Create modal */}
      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop-enter bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md animate-scale-in rounded-3xl border border-slate-800/60 bg-slate-950 p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-white">Create a group</h2>
            <form onSubmit={async (event) => {
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
                const inserted = Array.isArray(data) ? data[0] : null;
                if (inserted) {
                  setPublicRooms((current) => [inserted as Room, ...current]);
                  setJoined((current) => new Set([...current, (inserted as Room).id]));
                  await supabase.from<RoomMember>("room_members").insert({ room_id: (inserted as Room).id, user_id: profile.id });
                }
                setShowCreate(false);
                setNewGroupName("");
                setNewLocation("");
                setNewContactInfo("");
                setNewInvitedPeople("");
              }
              setCreating(false);
            }}>
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name *" className="mb-3 w-full rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-500 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20" required />
              <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location (e.g. Library, Online, Campus)" className="mb-3 w-full rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-500 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20" />
              <input value={newContactInfo} onChange={(e) => setNewContactInfo(e.target.value)} placeholder="Contact Info (e.g. John @ 9876543210)" className="mb-3 w-full rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-500 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20" />
              <input value={newInvitedPeople} onChange={(e) => setNewInvitedPeople(e.target.value)} placeholder="Invited Members (e.g. Alice, Bob, Charlie)" className="mb-5 w-full rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-500 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-rose-700 active:scale-[0.98] disabled:opacity-60">{creating ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
