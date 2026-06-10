"use client";

import { MessageSquare, Users2, Lock } from "lucide-react";

export default function HubDirectoryPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0c] items-center justify-center border-l border-[var(--border)]">
      <div className="flex flex-col items-center justify-center max-w-md text-center p-8 rounded-2xl bg-[#0f0f11] border border-[#2a2a2c] shadow-2xl">
        <div className="h-24 w-24 rounded-full bg-[var(--accent)] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(188,230,0,0.2)]">
          <MessageSquare size={48} className="text-black ml-1 mt-1" />
        </div>
        
        <h2 className="text-2xl font-light text-white mb-4">ChemSAGE Web</h2>
        
        <p className="text-[0.9375rem] text-[#8a8a8c] mb-8 leading-relaxed">
          Send and receive messages without keeping your phone online.<br/>
          Use ChemSAGE on up to 4 linked devices and 1 phone.
        </p>
        
        <div className="flex flex-col gap-4 text-left w-full border-t border-[#2a2a2c] pt-6">
          <div className="flex items-center gap-3 text-[#a0a0a0] text-sm">
            <Users2 size={16} className="text-[var(--accent)]" />
            <span>Switch to the <strong>Discover</strong> tab to find classmates.</span>
          </div>
          <div className="flex items-center gap-3 text-[#a0a0a0] text-sm">
            <Lock size={16} className="text-[var(--accent)]" />
            <span>End-to-end encrypted direct messaging.</span>
          </div>
        </div>
      </div>
      
      <p className="absolute bottom-8 flex items-center gap-2 text-xs text-[#6a6a6c]">
        <Lock size={10} /> Your personal messages are private and secured.
      </p>
    </div>
  );
}
