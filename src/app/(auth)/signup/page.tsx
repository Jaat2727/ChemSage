"use client";

import Link from "next/link";
import { useState } from "react";
import { Hexagon, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 border border-slate-100 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full text-green-600">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] mb-2">Account pending approval</h2>
        <p className="text-slate-500 leading-relaxed mb-8">
          We'll notify you on your smail email once approved.
        </p>
        <Link 
          href="/login"
          className="block w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 border border-slate-100 relative pt-12 pb-6 px-8 my-8">
      <Link href="/login" className="absolute top-6 left-6 text-slate-400 hover:text-[#0f172a] transition-colors flex items-center gap-1.5 text-sm font-semibold">
        <ArrowLeft size={16} /> Back
      </Link>
      
      <div className="flex flex-col items-center mb-8 mt-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Create Account</h1>
        <p className="text-sm text-slate-500 font-medium tracking-wide">Join ChemSAGE</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsSuccess(true); }}>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Full Name</label>
          <input 
            type="text" 
            placeholder="John Doe" 
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input 
            type="email" 
            placeholder="rollno@smail.iitm.ac.in" 
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-blue-600 font-medium mt-1 inline-block bg-blue-50 px-2 py-1 rounded">
            Only @smail.iitm.ac.in emails are allowed
          </p>
        </div>
        
        <div className="space-y-1.5 relative">
          <label className="text-sm font-semibold text-slate-700">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required
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

        <div className="space-y-1.5 relative pb-2">
          <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md">
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}
