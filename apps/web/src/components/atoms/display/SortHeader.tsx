interface SortHeaderProps<T extends string> {
  label: string;
  column: T;
  sortCol: T;
  sortDir: "asc" | "desc";
  onSort: (col: T) => void;
}

export function SortHeader<T extends string>({
  label, column, sortCol, sortDir, onSort,
}: SortHeaderProps<T>) {
  const active = sortCol === column;
  return (
    <button
      onClick={() => onSort(column)}
      className={`text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
        active ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
