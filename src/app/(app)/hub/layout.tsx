import { ReactNode } from "react";
import DirectChatsSidebar from "./DirectChatsSidebar";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-[calc(100vh-160px)] min-h-[600px] w-full">
      <div className="mx-auto flex h-full w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg">
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
