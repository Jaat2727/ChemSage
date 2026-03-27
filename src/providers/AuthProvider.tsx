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

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      
      if (nextSession?.user?.id) {
        try {
          const { data, error } = await supabase
            .from<Profile>("profiles")
            .select("*")
            .eq("id", nextSession.user.id)
            .single();

          if (!active) return;

          if (error) {
            setSession(nextSession);
            setProfile(null);
          } else {
            setSession(nextSession);
            setProfile(data as Profile);
          }
        } catch (err) {
          if (!active) return;
          console.error(err);
          setSession(nextSession);
          setProfile(null);
        }
      } else {
        setSession(null);
        setProfile(null);
      }
      
      if (active) setLoading(false);
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
