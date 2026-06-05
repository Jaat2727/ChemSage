import { AuthRouteGate } from "@/components/auth/RouteGate";
import CursorFollower from "@/components/CursorFollower";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouteGate>
      <CursorFollower />
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[var(--background)] p-4 sm:p-6">
        <div className="relative z-10 w-full max-w-sm">{children}</div>
      </div>
    </AuthRouteGate>
  );
}
