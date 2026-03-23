"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { isSmailEmail } from "@/lib/rollno";
import { InlineAlert } from "@/components/ui/Feedback";

const supabase = createClientComponentClient();

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const interval = setInterval(() => setTimer((value) => value - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const otpValue = useMemo(() => otp.join(""), [otp]);

  const sendOtp = async () => {
    if (!isSmailEmail(email)) {
      throw new Error("Please enter your IITM smail address.");
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
    if (otpError) throw otpError;
  };

  return (
    <div className="relative my-8 w-full max-w-sm rounded-2xl border border-slate-100 bg-white px-8 pb-8 pt-12 text-slate-900 shadow-xl">
      {step < 4 ? (
        <button onClick={() => (step === 1 ? window.history.back() : setStep((value) => (value - 1) as 1 | 2 | 3))} className="absolute left-6 top-6 flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-[#0f172a]">
          <ArrowLeft size={16} /> Back
        </button>
      ) : null}

      {step === 1 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8 mt-2 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
              <KeyRound size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Forgot Password</h1>
            <p className="mt-2 text-sm font-medium tracking-wide text-slate-500">Enter your registered smail address to receive an OTP.</p>
          </div>

          <form
            className="space-y-6"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                await sendOtp();
                setStep(2);
                setTimer(60);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Unable to send OTP.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rollno@smail.iitm.ac.in" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <InlineAlert message={error} />

            <button disabled={loading} type="submit" className="w-full rounded-xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-60">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8 mt-2 flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Verify OTP</h1>
            <p className="mt-2 px-4 text-sm font-medium tracking-wide text-slate-500">We&apos;ve sent a 6-digit code to your email.</p>
          </div>

          <form
            className="space-y-8"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                if (otpValue.length !== 6) {
                  throw new Error("Please enter the full 6-digit OTP.");
                }
                const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otpValue, type: "email" });
                if (verifyError) throw verifyError;
                setStep(3);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Unable to verify OTP.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    inputsRef.current[index] = node;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 1);
                    setOtp((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
                    if (value) inputsRef.current[index + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index]) {
                      inputsRef.current[index - 1]?.focus();
                    }
                  }}
                  className="h-14 w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  required
                />
              ))}
            </div>

            <InlineAlert message={error} />

            <div className="text-center">
              <p className="mb-1 text-sm font-medium text-slate-500">Didn&apos;t receive code?</p>
              {timer > 0 ? (
                <p className="text-sm font-semibold text-slate-400">Resend in 00:{timer.toString().padStart(2, "0")}</p>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      await sendOtp();
                      setTimer(60);
                    } catch (caught) {
                      setError(caught instanceof Error ? caught.message : "Unable to resend OTP.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button disabled={loading} type="submit" className="w-full rounded-xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-60">
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8 mt-2 flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Reset Password</h1>
            <p className="mt-2 text-sm font-medium tracking-wide text-slate-500">Create a strong new password for your account.</p>
          </div>

          <form
            className="space-y-6"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                if (password !== confirmPassword) {
                  throw new Error("Passwords do not match.");
                }
                const { error: updateError } = await supabase.auth.updateUser({ password });
                if (updateError) throw updateError;
                setStep(4);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Unable to update password.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <InlineAlert message={error} />

            <button disabled={loading} type="submit" className="mt-4 w-full rounded-xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-60">
              {loading ? "Updating password..." : "Update Password"}
            </button>
          </form>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 py-6 text-center duration-300">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-4 text-green-600">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#0f172a]">Password Updated</h2>
          <p className="mb-8 leading-relaxed text-slate-500">Your password has been successfully reset. You can now login.</p>
          <Link href="/login" className="block w-full rounded-xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800">
            Go to Login
          </Link>
        </div>
      ) : null}
    </div>
  );
}
