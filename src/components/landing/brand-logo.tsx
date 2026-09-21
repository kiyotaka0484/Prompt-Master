import logoImg from "@/assets/prompt-master-logo.png";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export function BrandLogo({
  size = "md",
  showText = true,
  className,
  subtitle,
}: BrandLogoProps) {
  const sizeMap = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const textMap = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div
      className={cn("inline-flex items-center gap-3 select-none", className)}
    >
      <div className="relative group shrink-0">
        {/* Ambient violet-indigo glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-fuchsia-500 to-violet-600 opacity-60 blur-sm group-hover:opacity-90 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center rounded-xl bg-card border border-primary/30 p-1 shadow-lg shadow-primary/20">
          <img
            src={logoImg}
            alt="Prompt Master Logo"
            className={cn(sizeMap[size], "object-contain rounded-lg")}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div
            className={cn(
              "font-bold tracking-tight text-foreground flex items-center gap-1.5",
              textMap[size],
            )}
          >
            <span>Prompt</span>
            <span className="bg-gradient-to-r from-primary via-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
              Master
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] font-medium text-muted-foreground/80 tracking-wide">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
