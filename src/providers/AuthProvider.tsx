"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Profile, Session } from "@/lib/types";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const supabase = createClientComponentClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authSession = sessionData.session;
    if (!authSession?.user?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from<Profile>("profiles")
      .select("*")
      .eq("id", authSession.user.id)
      .single();

    if (error) {
      setProfile(null);
      return null;
    }

    setProfile(data as Profile);
    return data as Profile;
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session);
        if (data.session?.user?.id) {
          try {
            await refreshProfile();
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error("Bootstrap error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void bootstrap();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession?.user?.id) {
        try {
          await refreshProfile();
        } catch (err) {
          console.error(err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    loading,
    refreshProfile,
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
    },
  }), [loading, profile, refreshProfile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
