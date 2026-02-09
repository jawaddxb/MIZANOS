"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LoginForm } from "@/components/organisms/auth/LoginForm";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to Mizan Flow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Product Lifecycle Management Platform
          </p>
        </div>
        <LoginForm onSuccess={() => router.push(redirect as never)} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
