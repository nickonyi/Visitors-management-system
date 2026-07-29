import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ name, className, size = "md" }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-slate-900 text-white font-semibold shrink-0",
        sizes[size],
        className,
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}
