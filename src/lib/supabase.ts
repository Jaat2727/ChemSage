import { Session } from "@/lib/types";

type QueryValue = string | number | boolean;
type OnAuthStateChangeCallback = (event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "INITIAL_SESSION", session: Session | null) => void;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "chemsage.supabase.session";

function ensureEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }
}

function authHeaders(token?: string, extra?: HeadersInit): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

function buildQuery(params: URLSearchParams, key: string, operator: string, value: QueryValue | QueryValue[]) {
  const encoded = Array.isArray(value) ? `(${value.join(",")})` : `${value}`;
  params.set(key, `${operator}.${encoded}`);
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent("chemsage-auth", { detail: { event: "SIGNED_OUT", session: null } }));
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("chemsage-auth", { detail: { event: "SIGNED_IN", session } }));
}

class QueryBuilder<T> {
  private filters: Array<[string, string, QueryValue | QueryValue[]]> = [];
  private orderBy?: { column: string; ascending: boolean };
  private rowLimit?: number;
  private selectClause = "*";
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: unknown;
  private expectSingle = false;

  constructor(private table: string, private token?: string) {}

  select(columns = "*") {
    this.selectClause = columns;
    this.mode = "select";
    return this;
  }

  insert(payload: unknown) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: unknown, options?: { onConflict?: string }) {
    this.mode = "upsert";
    this.payload = payload;
    void options;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: QueryValue) {
    this.filters.push([column, "eq", value]);
    return this;
  }

  neq(column: string, value: QueryValue) {
    this.filters.push([column, "neq", value]);
    return this;
  }

  in(column: string, value: QueryValue[]) {
    this.filters.push([column, "in", value]);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(value: number) {
    this.rowLimit = value;
    return this;
  }

  single() {
    this.expectSingle = true;
    return this.execute();
  }

  then<TResult1 = { data: T | T[] | null; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | T[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<{ data: T | T[] | null; error: Error | null }> {
    ensureEnv();
    const params = new URLSearchParams();
    if (this.mode === "select") {
      params.set("select", this.selectClause);
    }
    for (const [column, operator, value] of this.filters) {
      buildQuery(params, column, operator, value);
    }
    if (this.orderBy) {
      params.set("order", `${this.orderBy.column}.${this.orderBy.ascending ? "asc" : "desc"}`);
    }
    if (this.rowLimit) {
      params.set("limit", `${this.rowLimit}`);
    }

    const url = `${SUPABASE_URL}/rest/v1/${this.table}${params.toString() ? `?${params}` : ""}`;
    const method = this.mode === "select" ? "GET" : this.mode === "insert" ? "POST" : this.mode === "update" ? "PATCH" : this.mode === "upsert" ? "POST" : "DELETE";
    const headers: HeadersInit = authHeaders(this.token, {
      "Content-Type": "application/json",
      Prefer: this.expectSingle ? "return=representation" : "return=representation",
      ...(this.mode === "upsert" ? { Prefer: "resolution=merge-duplicates,return=representation" } : {}),
    });

    const response = await fetch(url, {
      method,
      headers,
      body: this.mode === "select" || this.mode === "delete" ? undefined : JSON.stringify(this.payload),
      cache: "no-store",
    });

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      json = { message: text };
    }

    if (!response.ok) {
      return { data: null, error: new Error(json?.message ?? json?.error_description ?? response.statusText) };
    }

    if (this.expectSingle) {
      return { data: Array.isArray(json) ? (json[0] ?? null) : json, error: null };
    }

    return { data: json, error: null };
  }
}

class StorageBucket {
  constructor(private bucket: string, private token?: string) {}

  async upload(path: string, file: File, options?: { upsert?: boolean }) {
    ensureEnv();
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${this.bucket}/${path}`, {
      method: "POST",
      headers: authHeaders(this.token, { "x-upsert": `${options?.upsert ?? false}` }),
      body: file,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { data: null, error: new Error(data?.message ?? response.statusText) };
    }
    return { data, error: null };
  }

  getPublicUrl(path: string) {
    return {
      data: {
        publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${this.bucket}/${path}`,
      },
    };
  }

  async remove(paths: string[]) {
    ensureEnv();
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${this.bucket}`, {
      method: "DELETE",
      headers: authHeaders(this.token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: paths }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { data: null, error: new Error(data?.message ?? response.statusText) };
    }
    return { data, error: null };
  }
}

class RealtimeChannel {
  private config?: { table: string; filter?: string; callback: (payload: { new: Record<string, unknown> }) => void };
  private intervalId?: number;
  private lastSeen?: string;

  on(_type: "postgres_changes", config: { event: "INSERT"; schema: string; table: string; filter?: string }, callback: (payload: { new: Record<string, unknown> }) => void) {
    this.config = { table: config.table, filter: config.filter, callback };
    return this;
  }

  subscribe() {
    if (typeof window === "undefined" || !this.config) return this;
    const session = readSession();
    const poll = async () => {
      const builder = new QueryBuilder<Record<string, unknown>>(this.config!.table, session?.access_token).select("*").order("created_at", { ascending: true });
      if (this.config?.filter) {
        const [column, clause] = this.config.filter.split("=eq.");
        if (column && clause) builder.eq(column, clause);
      }
      if (this.lastSeen) {
        builder.neq("created_at", this.lastSeen);
      }
      const { data } = await builder;
      const rows = Array.isArray(data) ? data : [];
      for (const row of rows) {
        const createdAt = typeof row.created_at === "string" ? row.created_at : undefined;
        if (createdAt && (!this.lastSeen || createdAt > this.lastSeen)) {
          this.lastSeen = createdAt;
          this.config?.callback({ new: row });
        }
      }
    };
    void poll();
    this.intervalId = window.setInterval(poll, 4000);
    return this;
  }

  unsubscribe() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }
}

function baseClient(token?: string) {
  return {
    auth: {
      async signUp({ email, password }: { email: string; password: string }) {
        ensureEnv();
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: "POST",
          headers: authHeaders(undefined, { "Content-Type": "application/json" }),
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { data: null, error: new Error(data?.msg ?? data?.error_description ?? response.statusText) };
        }
        if (data?.access_token) writeSession(data as Session);
        return { data, error: null };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        ensureEnv();
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: authHeaders(undefined, { "Content-Type": "application/json" }),
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { data: null, error: new Error(data?.error_description ?? response.statusText) };
        }
        writeSession(data as Session);
        return { data, error: null };
      },
      async signInWithOtp({ email }: { email: string }) {
        ensureEnv();
        const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
          method: "POST",
          headers: authHeaders(undefined, { "Content-Type": "application/json" }),
          body: JSON.stringify({ email, create_user: false, should_create_user: false }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          return { data: null, error: new Error(data?.error_description ?? response.statusText) };
        }
        return { data, error: null };
      },
      async verifyOtp({ email, token, type }: { email: string; token: string; type: "email" | "recovery" }) {
        ensureEnv();
        const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
          method: "POST",
          headers: authHeaders(undefined, { "Content-Type": "application/json" }),
          body: JSON.stringify({ email, token, type }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { data: null, error: new Error(data?.error_description ?? response.statusText) };
        }
        if (data?.access_token) writeSession(data as Session);
        return { data, error: null };
      },
      async updateUser({ password }: { password: string }) {
        const session = readSession();
        ensureEnv();
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          method: "PUT",
          headers: authHeaders(session?.access_token, { "Content-Type": "application/json" }),
          body: JSON.stringify({ password }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { data: null, error: new Error(data?.error_description ?? response.statusText) };
        }
        return { data, error: null };
      },
      async getSession() {
        return { data: { session: readSession() }, error: null };
      },
      onAuthStateChange(callback: OnAuthStateChangeCallback) {
        if (typeof window === "undefined") {
          return { data: { subscription: { unsubscribe: () => undefined } } };
        }
        callback("INITIAL_SESSION", readSession());
        const handler = (event: Event) => {
          const detail = (event as CustomEvent).detail as { event: "SIGNED_IN" | "SIGNED_OUT"; session: Session | null };
          callback(detail.event, detail.session);
        };
        window.addEventListener("chemsage-auth", handler);
        return {
          data: {
            subscription: {
              unsubscribe: () => window.removeEventListener("chemsage-auth", handler),
            },
          },
        };
      },
      async signOut() {
        writeSession(null);
        return { error: null };
      },
    },
    from<T>(table: string) {
      return new QueryBuilder<T>(table, token ?? readSession()?.access_token);
    },
    storage: {
      from(bucket: string) {
        return new StorageBucket(bucket, token ?? readSession()?.access_token);
      },
    },
    functions: {
      async invoke(name: string, options?: { body?: unknown }) {
        ensureEnv();
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
          method: "POST",
          headers: authHeaders(token ?? readSession()?.access_token, { "Content-Type": "application/json" }),
          body: JSON.stringify(options?.body ?? {}),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          return { data: null, error: new Error(data?.message ?? response.statusText) };
        }
        return { data, error: null };
      },
    },
    channel(name: string) {
      void name;
      return new RealtimeChannel();
    },
    removeChannel(channel: RealtimeChannel) {
      channel.unsubscribe();
    },
  };
}

export function createClientComponentClient() {
  return baseClient();
}

export function createServerComponentClient() {
  return baseClient();
}

export const supabase = createClientComponentClient();
