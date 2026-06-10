"use client";

import { MessageSquare } from "lucide-react";

export default function HubDirectoryPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0c] bg-[url('/chat-pattern.png')] bg-repeat items-center justify-center" style={{ backgroundSize: '400px' }}>
      <div className="flex flex-col items-center justify-center -mt-20">
        <div className="h-24 w-24 rounded-full bg-[#1a1a1c] flex items-center justify-center mb-6 shadow-lg shadow-black/50">
          <MessageSquare size={40} className="text-[#6a6a6c] ml-1 mt-1" />
        </div>
        <h2 className="text-[1.125rem] font-bold text-white mb-2">Select a chat to start messaging</h2>
        <p className="text-[0.9375rem] text-[#6a6a6c] max-w-sm text-center">
          Choose a conversation from the left menu or search for a classmate to start a new direct message.
        </p>
      </div>
    </div>
  );
}
