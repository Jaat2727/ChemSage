"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

// Mock User Data
const currentUser = {
  alias: "Proton#1024",
  badge: "BS 25",
  isMe: true
};

const anonUser = {
  alias: "Anonymous",
  badge: "BS 25",
  isMe: true
};

// Initial Mock Messages
const initialMessages = [
  {
    id: 1,
    alias: "Electron#4821",
    badge: "BS 25",
    text: "Does anyone have the simplified mechanism for the Wittig reaction? Dr. Sharma rushed through it today.",
    timestamp: "10:42 AM",
    isMe: false,
  },
  {
    id: 2,
    alias: "Benzene_Ring#99",
    badge: "MSc 24",
    text: "Yeah I've got my notes from last year. Give me a sec, I'll drop a link to my Vault folder.",
    timestamp: "10:45 AM",
    isMe: false,
  },
  {
    id: 3,
    alias: "Proton#1024",
    badge: "BS 25",
    text: "That would be a lifesaver, thanks! Also, is the lab report for CH1010 due tomorrow at midnight or 5 PM?",
    timestamp: "10:47 AM",
    isMe: true,
  },
  {
    id: 4,
    alias: "Catalyst_King",
    badge: "PhD 22",
    text: "CH1010 is tomorrow at 11:59 PM. Don't forget to include the error analysis section, TA was very strict about it last week.",
    timestamp: "10:51 AM",
    isMe: false,
  },
  {
    id: 5,
    alias: "Anonymous",
    badge: "BS 25",
    text: "Honestly, I have no idea how to even start the error analysis for the calorimetry experiment... 😭",
    timestamp: "10:55 AM",
    isMe: false,
  },
  {
    id: 6,
    alias: "Electron#4821",
    badge: "BS 25",
    text: "Same here. We should probably form a quick Synergy Group later tonight to go over it?",
    timestamp: "10:58 AM",
    isMe: false,
  },
  {
    id: 7,
    alias: "Proton#1024",
    badge: "BS 25",
    text: "I'm down for a study session tonight. Say around 8 PM at the library?",
    timestamp: "11:02 AM",
    isMe: true,
  },
  {
    id: 8,
    alias: "Benzene_Ring#99",
    badge: "MSc 24",
    text: "Here's the Wittig reaction notes link btw: chemsage.app/vault/shared/wittig-mech",
    timestamp: "11:05 AM",
    isMe: false,
  }
];

export default function NetworkHubPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeUser = isAnon ? anonUser : currentUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      alias: activeUser.alias,
      badge: activeUser.badge,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 relative">
      
      {/* Top Bar Component */}
      <div className="flex-none bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10 shadow-sm sticky top-0">
        <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors p-2 -ml-2">
          <ArrowLeft size={22} />
        </Link>
        
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-slate-800 text-lg">Network Hub</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-[10px] font-bold text-green-700 whitespace-nowrap">24 online</span>
          </div>

          {/* Anon Toggle */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-full p-1 bg-slate-50">
            <span className={`text-[10px] font-bold px-1.5 ${isAnon ? 'text-slate-800' : 'text-slate-400'}`}>
              Anon
            </span>
            <button 
              onClick={() => setIsAnon(!isAnon)}
              className={`w-9 h-5 rounded-full relative transition-colors duration-300 focus:outline-none ${isAnon ? 'bg-indigo-500' : 'bg-slate-300'}`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${isAnon ? 'translate-x-4.5' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-baseline gap-2 mb-1 px-1 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-xs font-bold text-slate-700">{msg.alias}</span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                {msg.badge}
              </span>
            </div>
            
            <div 
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                msg.isMe 
                  ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-900/10' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
              }`}
            >
              <p className="text-[15px] leading-snug">{msg.text}</p>
            </div>
            
            <span className="text-[10px] text-slate-400 font-medium mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-safe z-20 md:hidden">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-5xl mx-auto">
          <div className="flex-1 bg-slate-100 rounded-3xl border border-slate-200 px-4 py-1 pb-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Message the hub..."
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-[15px] placeholder-slate-400 resize-none min-h-[40px] max-h-[120px] py-2.5"
              rows={1}
            />
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition-colors flex-shrink-0 mb-1"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
      </div>

      {/* Desktop warning since user requested Mobile First */}
      <div className="hidden md:flex fixed bottom-0 md:pl-64 left-0 right-0 bg-white border-t border-slate-200 p-4 z-20 items-center justify-center">
        <p className="text-slate-500 text-sm font-medium">Please view Network Hub on a mobile device for the full chat experience.</p>
      </div>
    </div>
  );
}
