"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/molecules/buttons/Button";
import { TextField } from "@/components/molecules/forms/TextField";

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "submitting" | "success" | "error">("form");
  const [message, setMessage] = useState("");

  const isValid = password.length >= 8 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setStatus("submitting");
    try {
      const res = await apiClient.post<{ message: string }>("/auth/activate", {
        token,
        password,
      });
      setStatus("success");
      setMessage(res.data.message);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      setStatus("error");
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setMessage(detail ?? "Activation failed. The link may be expired.");
    }
  };

  const heading = !token
    ? { title: "Invalid Link", subtitle: "No activation token was provided in the URL." }
    : { title: "Activate your account", subtitle: "Choose a password to complete your account setup" };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-white">
        <div>
          <svg width="40" height="40" viewBox="0 0 32 32" className="mb-1">
            <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
            <path d="M5 16 Q8 21 11 16 L16 8 L21 16 Q24 21 27 16" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="7" r="1.5" fill="white" opacity="0.8" />
            <line x1="16" y1="10" x2="16" y2="25" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            <line x1="11" y1="25" x2="21" y2="25" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            <path d="M23 4 L23.6 5.4 L25 6 L23.6 6.6 L23 8 L22.4 6.6 L21 6 L22.4 5.4 Z" fill="white" opacity="0.85" />
            <path d="M9 3 L9.4 3.9 L10.3 4.3 L9.4 4.7 L9 5.6 L8.6 4.7 L7.7 4.3 L8.6 3.9 Z" fill="white" opacity="0.5" />
          </svg>
          <span className="text-lg font-semibold tracking-tight opacity-90">
            Mizan
          </span>
        </div>

        <div className="space-y-6">
          <blockquote className="text-2xl/relaxed font-light tracking-tight opacity-95">
            Streamline your product lifecycle from intake to delivery&nbsp;&mdash;
            one platform for specs, tasks, audits, and team management.
          </blockquote>
          <div className="flex items-center gap-3 text-sm opacity-70">
            <div className="h-px w-8 bg-white/40" />
            Product Lifecycle Management
          </div>
        </div>

        <p className="text-xs opacity-40">
          &copy; {new Date().getFullYear()} Mizan. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <svg width="32" height="32" viewBox="0 0 32 32">
              <defs>
                <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#ag)" />
              <path d="M5 16 Q8 21 11 16 L16 8 L21 16 Q24 21 27 16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="7" r="1.5" fill="white" opacity="0.8" />
              <line x1="16" y1="10" x2="16" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
              <line x1="11" y1="25" x2="21" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
              <path d="M23 4 L23.6 5.4 L25 6 L23.6 6.6 L23 8 L22.4 6.6 L21 6 L22.4 5.4 Z" fill="white" opacity="0.9" />
              <path d="M9 3 L9.4 3.9 L10.3 4.3 L9.4 4.7 L9 5.6 L8.6 4.7 L7.7 4.3 L8.6 3.9 Z" fill="white" opacity="0.6" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">Mizan</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {heading.title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {heading.subtitle}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            {!token ? (
              <p className="text-sm text-destructive text-center">
                Please check the link in your invitation email and try again.
              </p>
            ) : status === "success" ? (
              <div className="text-center space-y-3 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-green-600">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login in 3 seconds...
                </p>
              </div>
            ) : status === "error" ? (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <TextField
                  label="Password"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <div>
                  <TextField
                    label="Confirm password"
                    type="password"
                    required
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-10"
                  loading={status === "submitting"}
                  disabled={!isValid}
                >
                  {status === "submitting" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Activate Account
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateContent />
    </Suspense>
  );
}
