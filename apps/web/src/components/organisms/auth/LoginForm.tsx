"use client";

import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";
import { TextField } from "@/components/molecules/forms/TextField";
import { useAuth } from "@/contexts/AuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LoginFormProps {
  /** Called after a successful login. */
  onSuccess?: () => void;
  /** Called when the user clicks "Forgot password". */
  onForgotPassword?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginForm({
  onSuccess,
  onForgotPassword,
  className,
}: LoginFormProps) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6 w-full max-w-sm", className)}
      noValidate
    >
      <div className="space-y-4">
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={isSubmitting}
        />

        <TextField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        leftIcon={<LogIn className="h-4 w-4" />}
      >
        Sign in
      </Button>

      {onForgotPassword && (
        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Forgot your password?
          </button>
        </div>
      )}
    </form>
  );
}
