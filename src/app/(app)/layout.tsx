import { Sidebar } from "@/components/Sidebar";
import { MobileTabBar } from "@/components/MobileTabBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden absolute top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-slate-800 flex items-center px-4 z-40">
          <h1 className="text-[20px] font-bold tracking-tight text-white leading-tight">ChemSAGE</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto mt-16 md:mt-0 mb-16 md:mb-0 p-6 md:p-8">
          {children}
        </div>
      </main>

      <MobileTabBar />
    </>
  );
}
