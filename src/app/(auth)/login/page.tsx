"use client";

import Link from "next/link";
import { useState } from "react";
import { Hexagon, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 border border-slate-100">
      <div className="p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#0f172a] p-3 rounded-xl text-white shadow-md mb-4">
            <Hexagon size={28} className="fill-current text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">ChemSAGE</h1>
          <p className="text-sm text-slate-500 font-medium tracking-wide">Chemistry workspace</p>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input 
              type="email" 
              placeholder="rollno@smail.iitm.ac.in" 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="space-y-1.5 relative">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md">
              Login
            </button>
          </div>

          <div className="text-center pt-2">
            <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
      
      <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
