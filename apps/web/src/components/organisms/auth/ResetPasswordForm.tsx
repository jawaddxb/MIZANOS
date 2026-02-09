"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/molecules/buttons/Button";
import { TextField } from "@/components/molecules/forms/TextField";
import { authRepository } from "@/lib/api/repositories";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResetPasswordFormProps {
  /** If a reset token is present, show the "new password" step. */
  token?: string;
  /** Called when the user wants to navigate back to login. */
  onBackToLogin?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Success view
// ---------------------------------------------------------------------------

interface SuccessViewProps {
  hasToken: boolean;
  onBackToLogin?: () => void;
  className?: string;
}

function SuccessView({ hasToken, onBackToLogin, className }: SuccessViewProps) {
  return (
    <div className={cn("space-y-4 w-full max-w-sm text-center", className)}>
      <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        {hasToken ? (
          <KeyRound className="h-6 w-6 text-primary" />
        ) : (
          <Mail className="h-6 w-6 text-primary" />
        )}
      </div>
      <h3 className="font-semibold text-lg">
        {hasToken ? "Password updated" : "Check your email"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {hasToken
          ? "Your password has been reset successfully. You can now sign in with your new password."
          : "If an account exists with that email, we have sent a password reset link."}
      </p>
      {onBackToLogin && (
        <Button
          variant="outline"
          onClick={onBackToLogin}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to login
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Back link
// ---------------------------------------------------------------------------

function BackToLoginLink({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onClick}
        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
      >
        Back to login
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResetPasswordForm({
  token,
  onBackToLogin,
  className,
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ---------- Request reset link ----------
  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authRepository.resetPassword({ email: email.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset link.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Confirm new password ----------
  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authRepository.confirmReset({
        token,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. The link may have expired.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Success ----------
  if (success) {
    return (
      <SuccessView
        hasToken={!!token}
        onBackToLogin={onBackToLogin}
        className={className}
      />
    );
  }

  // ---------- Confirm step (token present) ----------
  if (token) {
    return (
      <form
        onSubmit={handleConfirmReset}
        className={cn("space-y-6 w-full max-w-sm", className)}
        noValidate
      >
        <div className="space-y-2 text-center">
          <h3 className="font-semibold text-lg">Set a new password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <div className="space-y-4">
          <TextField
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={isSubmitting}
          />
          <TextField
            label="Confirm password"
            type="password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
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
          leftIcon={<KeyRound className="h-4 w-4" />}
        >
          Reset password
        </Button>

        {onBackToLogin && <BackToLoginLink onClick={onBackToLogin} />}
      </form>
    );
  }

  // ---------- Request step (no token) ----------
  return (
    <form
      onSubmit={handleRequestReset}
      className={cn("space-y-6 w-full max-w-sm", className)}
      noValidate
    >
      <div className="space-y-2 text-center">
        <h3 className="font-semibold text-lg">Reset your password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send you a reset link.
        </p>
      </div>

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

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        leftIcon={<Mail className="h-4 w-4" />}
      >
        Send reset link
      </Button>

      {onBackToLogin && <BackToLoginLink onClick={onBackToLogin} />}
    </form>
  );
}
