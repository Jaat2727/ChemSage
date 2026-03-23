"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { Room, RoomMember } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function GroupsPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.status !== "active") {
      return;
    }

    const load = async () => {
      const [roomsResponse, joinedResponse] = await Promise.all([
        supabase.from<Room>("rooms").select("*").eq("is_public", true).order("created_at", { ascending: false }),
        supabase.from<RoomMember>("room_members").select("room_id, user_id").eq("user_id", profile.id),
      ]);
      if (roomsResponse.error) setError(roomsResponse.error.message);
      if (joinedResponse.error) setError(joinedResponse.error.message);
      setRooms(Array.isArray(roomsResponse.data) ? roomsResponse.data : []);
      setJoinedIds((Array.isArray(joinedResponse.data) ? joinedResponse.data : []).map((item) => item.room_id));
      setLoading(false);
    };
    void load();
  }, [profile]);

  const yourGroups = useMemo(() => rooms.filter((room) => joinedIds.includes(room.id)), [joinedIds, rooms]);
  const discoverGroups = useMemo(() => rooms.filter((room) => !joinedIds.includes(room.id)), [joinedIds, rooms]);

  const joinRoom = async (roomId: string) => {
    if (!profile) return;
    const { error: joinError } = await supabase.from<RoomMember>("room_members").insert({ room_id: roomId, user_id: profile.id });
    if (joinError) {
      setError(joinError.message);
      return;
    }
    setJoinedIds((current) => Array.from(new Set([...current, roomId])));
  };

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Synergy Groups locked" description="Only active users can discover and join study groups." />;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <PageHeader title="Synergy Groups" description="Public rooms, membership, and group chat are all wired to Supabase tables now." profile={profile} action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> Create group</button>} />
      <InlineAlert message={error} />
      {loading ? <LoadingCard title="Loading groups..." /> : null}

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-pink-300" />
          <h2 className="text-xl font-semibold text-white">Your groups</h2>
        </div>
        {!yourGroups.length ? <EmptyState title="You have not joined any groups yet" description="Join a public room below or create a new group for your cohort." /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {yourGroups.map((room) => (
            <article key={room.id} className="rounded-3xl border border-slate-800 bg-[#0f172a]/80 p-5">
              <h3 className="text-xl font-semibold text-white">{room.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{room.description || "No description yet."}</p>
              <Link href={`/groups/${room.id}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-4 py-2 text-sm font-semibold text-pink-300 transition hover:bg-pink-500/20">
                Open group <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-slate-300" />
          <h2 className="text-xl font-semibold text-white">Discover</h2>
        </div>
        {!discoverGroups.length ? <EmptyState title="Nothing new to join" description="You are already a member of every public room in the directory." /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {discoverGroups.map((room) => (
            <article key={room.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <h3 className="text-xl font-semibold text-white">{room.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{room.description || "No description yet."}</p>
              <button onClick={() => void joinRoom(room.id)} className="mt-4 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700">Join group</button>
            </article>
          ))}
        </div>
      </section>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-t-[32px] border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create group</h2>
              <button onClick={() => setShowCreate(false)} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button>
            </div>
            <form className="space-y-4" onSubmit={async (event) => {
              event.preventDefault();
              if (!profile) return;
              setError(null);
              const roomId = slugify(form.name);
              const { data: roomData, error: roomError } = await supabase.from<Room>("rooms").insert({ id: roomId, name: form.name, description: form.description, created_by: profile.id, is_public: true });
              if (roomError) {
                setError(roomError.message);
                return;
              }
              const { error: memberError } = await supabase.from<RoomMember>("room_members").insert({ room_id: roomId, user_id: profile.id });
              if (memberError) {
                setError(memberError.message);
                return;
              }
              const inserted = Array.isArray(roomData) ? roomData[0] : null;
              if (inserted) setRooms((current) => [inserted as Room, ...current]);
              setJoinedIds((current) => Array.from(new Set([...current, roomId])));
              setShowCreate(false);
              setForm({ name: "", description: "" });
            }}>
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Group name" className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-pink-500" required />
              <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Describe the purpose of this group" className="min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-pink-500" />
              <button type="submit" className="w-full rounded-2xl bg-pink-600 px-4 py-3 font-semibold text-white">Create and join group</button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
