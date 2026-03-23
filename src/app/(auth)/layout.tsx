import { AuthRouteGate } from "@/components/auth/RouteGate";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouteGate>
      <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-y-auto p-4">
        {/* Decorative gradient orbs behind auth card */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-blue-500/[0.12] blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[250px] w-[250px] rounded-full bg-indigo-400/[0.08] blur-[80px]" />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </AuthRouteGate>
  );
}
