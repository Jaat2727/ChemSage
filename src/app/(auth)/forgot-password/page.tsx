"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 border border-slate-100 relative pt-12 pb-8 px-8 my-8">
      {step < 4 && (
        <button 
          onClick={() => step === 1 ? window.history.back() : setStep(step - 1 as any)}
          className="absolute top-6 left-6 text-slate-400 hover:text-[#0f172a] transition-colors flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      {/* STEP 1: Email Entry */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col items-center mb-8 mt-2 text-center">
            <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-4">
              <KeyRound size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Forgot Password</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide mt-2">
              Enter your registered smail address to receive an OTP.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setStep(2); setTimer(60); }}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input 
                type="email" 
                placeholder="rollno@smail.iitm.ac.in" 
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button type="submit" className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md">
              Send OTP
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: OTP Verification */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col items-center mb-8 mt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Verify OTP</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide mt-2 px-4">
              We've sent a 6-digit code to your email.
            </p>
          </div>

          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0"
                  required
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 mb-1">Didn't receive code?</p>
              {timer > 0 ? (
                <p className="text-sm font-semibold text-slate-400">Resend in 00:{timer.toString().padStart(2, '0')}</p>
              ) : (
                <button type="button" onClick={() => setTimer(60)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  Resend OTP
                </button>
              )}
            </div>

            <button type="submit" className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md">
              Verify
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: Reset Password */}
      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col items-center mb-8 mt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Reset Password</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide mt-2">
              Create a strong new password for your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setStep(4); }}>
            <div className="space-y-1.5 focus-within:relative">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="flex gap-1 mt-2">
                <div className="h-1.5 flex-1 bg-green-500 rounded-full"></div>
                <div className="h-1.5 flex-1 bg-green-500 rounded-full"></div>
                <div className="h-1.5 flex-1 bg-slate-200 rounded-full"></div>
                <div className="h-1.5 flex-1 bg-slate-200 rounded-full"></div>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">Medium strength</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button type="submit" className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md mt-4">
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center py-6">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full text-green-600">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] mb-2">Password Updated</h2>
          <p className="text-slate-500 leading-relaxed mb-8">
            Your password has been successfully reset. You can now login.
          </p>
          <Link 
            href="/login"
            className="block w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md"
          >
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}
