import { AuthRouteGate } from "@/components/auth/RouteGate";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouteGate>
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.12),transparent_28%)]" />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </AuthRouteGate>
  );
}
