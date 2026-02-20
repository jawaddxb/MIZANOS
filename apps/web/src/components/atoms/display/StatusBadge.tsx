import { cn } from "@/lib/utils/cn";

const styles: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  invited: "bg-amber-100 text-amber-700 border-amber-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

const labels: Record<string, string> = {
  active: "Active Member",
  invited: "Pending Invite",
  pending: "Pending Invite",
  suspended: "Suspended",
};

export function StatusBadge({ status }: { status: string | null }) {
  const key = status ?? "active";
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", styles[key] ?? styles.active)}>
      {labels[key] ?? "Active"}
    </span>
  );
}
