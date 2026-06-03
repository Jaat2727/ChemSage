"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { isSmailEmail, normalizeEmail } from "@/lib/rollno";
import { InlineAlert } from "@/components/ui/Feedback";

const supabase = createClientComponentClient();

const inputClasses = "w-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const normalizedEmail = normalizeEmail(email);
    if (!isSmailEmail(normalizedEmail)) {
      throw new Error("Please enter your IITM smail address or a valid roll number.");
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
    if (otpError) throw otpError;
  };

  return (
    <div className="relative w-full max-w-sm animate-scale-in border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* MacOS-style window header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">chemsage_reset.ts</span>
        <div className="w-12" />
      </div>

      <div className="px-8 pb-8 pt-6">
        {step < 4 ? (
          <button onClick={() => (step === 1 ? window.history.back() : setStep((value) => (value - 1) as 1 | 2 | 3))} className="mb-4 flex items-center gap-1.5 font-mono text-sm text-[var(--muted)] transition-colors hover:text-white">
            <ArrowLeft size={16} /> {`< back`}
          </button>
        ) : null}

        {step === 1 ? (
          <div className="animate-slide-up">
            <div className="mb-8 mt-2 flex flex-col items-center text-center">
              <div className="mb-4 border border-[var(--border)] bg-[var(--background)] p-4 text-[var(--muted)]">
                <KeyRound size={28} />
              </div>
              <h1 className="font-mono text-2xl font-bold text-white">forgotPassword()</h1>
              <p className="mt-2 font-mono text-sm text-[var(--muted)]">{`// Enter your registered smail address to receive an OTP.`}</p>
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
                <label className="font-mono text-xs text-[var(--muted)]">EMAIL</label>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="CY25B013 or rollno@smail.iitm.ac.in" required className={inputClasses} />
              </div>

              <InlineAlert message={error} />

              <button disabled={loading} type="submit" className="w-full border border-[var(--accent)] bg-[var(--accent)] py-3 font-mono text-sm font-bold text-black disabled:opacity-60">
                {loading ? "sending_otp..." : "sendOtp()"}
              </button>
            </form>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="animate-slide-up">
            <div className="mb-8 mt-2 flex flex-col items-center text-center">
              <h1 className="font-mono text-2xl font-bold text-white">verifyOtp()</h1>
              <p className="mt-2 font-mono text-sm text-[var(--muted)]">{`// We've sent a 6-digit code to your email.`}</p>
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
                  const normalizedEmail = normalizeEmail(email);
                  const { error: verifyError } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: otpValue, type: "email" });
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
                    className="h-14 w-12 border border-[var(--border)] bg-[var(--surface)] text-center font-mono text-xl font-bold text-white focus:border-[var(--accent)] focus:outline-none"
                    placeholder="0"
                    required
                  />
                ))}
              </div>

              <InlineAlert message={error} />

              <div className="text-center">
                <p className="mb-1 font-mono text-sm text-[var(--muted)]">{`// Didn't receive code?`}</p>
                {timer > 0 ? (
                  <p className="font-mono text-sm text-[var(--muted)]">resend in 00:{timer.toString().padStart(2, "0")}</p>
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
                    className="font-mono text-sm text-[var(--accent)] hover:underline"
                  >
                    resendOtp()
                  </button>
                )}
              </div>

              <button disabled={loading} type="submit" className="w-full border border-[var(--accent)] bg-[var(--accent)] py-3 font-mono text-sm font-bold text-black disabled:opacity-60">
                {loading ? "verifying..." : "verify()"}
              </button>
            </form>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="animate-slide-up">
            <div className="mb-8 mt-2 flex flex-col items-center text-center">
              <h1 className="font-mono text-2xl font-bold text-white">resetPassword()</h1>
              <p className="mt-2 font-mono text-sm text-[var(--muted)]">{`// Create a strong new password for your account.`}</p>
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
                <label className="font-mono text-xs text-[var(--muted)]">NEW_PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-[var(--muted)]">CONFIRM_PASSWORD</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <InlineAlert message={error} />

              <button disabled={loading} type="submit" className="mt-4 w-full border border-[var(--accent)] bg-[var(--accent)] py-3 font-mono text-sm font-bold text-black disabled:opacity-60">
                {loading ? "updating..." : "updatePassword()"}
              </button>
            </form>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="animate-scale-in py-6 text-center">
            <div className="mb-6 flex justify-center">
              <div className="border border-emerald-800 bg-emerald-950/30 p-4 text-emerald-300">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="mb-2 font-mono text-2xl font-bold text-white">password_updated ✓</h2>
            <p className="mb-8 leading-relaxed text-[var(--muted)]">Your password has been successfully reset. You can now login.</p>
            <Link href="/login" className="block w-full border border-[var(--accent)] bg-[var(--accent)] py-3 font-mono text-sm font-bold text-black">
              goToLogin()
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
