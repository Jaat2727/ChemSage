import { useMemo, useState } from "react";
import { Search, Shield, MoreVertical, Ban, UserCheck, UserMinus } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface UsersProps {
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  logAdminAction: (action: string, targetType: string, targetId?: string, details?: any) => Promise<void>;
  profile: Profile;
}

export default function UsersSection({ profiles, setProfiles, logAdminAction, profile: currentAdmin }: UsersProps) {
  const supabase = createClientComponentClient();
  const [search, setSearch] = useState("");
  const [filterProgramme, setFilterProgramme] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return profiles.filter((p) => {
      if (p.status === "pending") return false; // Handled in Pending Section
      const matchProgramme = filterProgramme === "All" || p.programme === filterProgramme;
      const matchStatus = filterStatus === "All" || p.status === filterStatus;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.roll_no || "").toLowerCase().includes(search.toLowerCase());
      return matchProgramme && matchStatus && matchSearch;
    });
  }, [profiles, filterProgramme, filterStatus, search]);

  const toggleStatus = async (user: Profile) => {
    const newStatus = user.status === "banned" ? "active" : "banned";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", user.id);
    if (!error) {
      setProfiles((cur) => cur.map((p) => p.id === user.id ? { ...p, status: newStatus } : p));
    }
    setActiveMenuId(null);
  };

  const toggleAdmin = async (user: Profile) => {
    const newRole = user.role === "admin" ? "student" : "admin";
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", user.id);
    if (!error) {
      setProfiles((cur) => cur.map((p) => p.id === user.id ? { ...p, role: newRole } : p));
    }
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">User Directory</h2>
        <p className="text-sm text-[var(--muted)]">Manage verified students and administrators.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by name or roll number..." 
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-11 pr-4 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)]" 
          />
        </div>
        <select 
          value={filterProgramme} 
          onChange={(e) => setFilterProgramme(e.target.value)} 
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)]"
        >
          <option value="All">All Programmes</option>
          <option value="BS">BS</option>
          <option value="MSc">MSc</option>
          <option value="PhD">PhD</option>
        </select>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)]"
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-visible">
        {filteredUsers.length === 0 ? (
          <div className="p-8"><EmptyState title="No users found" description="Try adjusting your search filters." /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-soft)]">
              <tr className="border-b border-[var(--border)] text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Programme</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-[var(--surface-soft)]/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--background)] border border-[var(--border)] text-xs font-bold text-[var(--accent)]">
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.name}</p>
                        <p className="text-xs text-[var(--muted)]">{user.roll_no}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-[var(--muted)]">{user.programme} '{user.batch_year.toString().slice(2)}</span>
                  </td>
                  <td className="px-5 py-4">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-400">
                        <Shield size={12} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-gray-400">
                        Student
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                      user.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right relative">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                      className="p-1.5 text-[var(--muted)] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuId === user.id && (
                      <div className="absolute right-6 top-10 z-10 w-48 rounded-lg border border-[var(--border)] bg-[#0A0A0A] p-1 shadow-xl">
                        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Actions</div>
                        
                        {user.id !== currentAdmin.id && (
                          <>
                            <button 
                              onClick={() => toggleAdmin(user)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-white hover:bg-white/5"
                            >
                              {user.role === "admin" ? <UserMinus size={14} /> : <Shield size={14} />}
                              {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                            </button>
                            
                            <button 
                              onClick={() => toggleStatus(user)}
                              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left ${
                                user.status === "banned" ? "text-emerald-400 hover:bg-emerald-500/10" : "text-red-400 hover:bg-red-500/10"
                              }`}
                            >
                              {user.status === "banned" ? <UserCheck size={14} /> : <Ban size={14} />}
                              {user.status === "banned" ? "Unban User" : "Ban User"}
                            </button>
                          </>
                        )}
                        
                        {user.id === currentAdmin.id && (
                          <div className="px-3 py-2 text-xs text-[var(--muted)]">Cannot modify your own account here.</div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Click outside to close menu handler could be added here, but relying on re-clicking or selecting for now */}
    </div>
  );
}
