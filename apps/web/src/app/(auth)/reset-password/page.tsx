"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResetPasswordForm } from "@/components/organisms/auth/ResetPasswordForm";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? undefined;

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
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#rg)" />
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
              {token ? "Set a new password" : "Reset your password"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {token
                ? "Choose a new password for your account"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <ResetPasswordForm
              token={token}
              onBackToLogin={() => router.push("/login")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
