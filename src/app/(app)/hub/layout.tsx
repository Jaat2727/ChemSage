import { ReactNode } from "react";
import DirectChatsSidebar from "./DirectChatsSidebar";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-8">
      <div className="mx-auto flex h-[calc(100dvh-6rem)] w-full max-w-[1400px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg">
        {/* Left Sidebar for DMs and Navigation */}
        <DirectChatsSidebar />
        
        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--background)] relative">
          {children}
        </div>
      </div>
    </div>
  );
}
