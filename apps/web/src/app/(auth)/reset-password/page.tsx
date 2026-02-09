"use client";

import { ResetPasswordForm } from "@/components/organisms/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
