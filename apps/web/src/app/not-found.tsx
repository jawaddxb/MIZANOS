import Link from "next/link";
import type { Route } from "next";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link
        href={"/" as Route}
        className="mt-8 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
