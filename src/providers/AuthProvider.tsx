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
      .from("profiles")
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

    // Fetch initial session and profile
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession && active) {
        setSession(initialSession as unknown as Session);
        refreshProfile().then(() => {
          if (active) setLoading(false);
        });
      } else {
        if (active) setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      
      if (nextSession?.user?.id) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", nextSession.user.id)
            .single();

          if (!active) return;

          if (error) {
            setSession(nextSession as unknown as Session);
            setProfile(null);
          } else {
            setSession(nextSession as unknown as Session);
            setProfile(data as Profile);
          }
        } catch (err) {
          if (!active) return;
          console.error(err);
          setSession(nextSession as unknown as Session);
          setProfile(null);
        }
      } else {
        setSession(null);
        setProfile(null);
      }
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
