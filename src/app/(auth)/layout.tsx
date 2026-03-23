import { AuthRouteGate } from "@/components/auth/RouteGate";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouteGate>
      <div className="flex h-full w-full flex-1 items-center justify-center overflow-y-auto p-4">{children}</div>
    </AuthRouteGate>
  );
}
