import { cn } from "@/lib/utils/cn";

interface MizanLogoProps {
  size?: number;
  className?: string;
}

export function MizanLogo({ size = 32, className }: MizanLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("text-current", className)}
    >
      <path
        d="M25 1.5 L26.2 3.8 L28.5 5 L26.2 6.2 L25 8.5 L23.8 6.2 L21.5 5 L23.8 3.8 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="16" cy="9" r="3.5" fill="currentColor" />
      <line x1="12.8" y1="11.5" x2="6" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="19.2" y1="11.5" x2="26" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="17" x2="6" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="20" x2="9" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="17" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="23" y1="20" x2="29" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="12.5" x2="16" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="10" y1="27" x2="22" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <circle cx="10" cy="7" r="1.2" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
