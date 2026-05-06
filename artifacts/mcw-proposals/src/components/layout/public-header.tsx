import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  variant?: "dark" | "light";
  subtitle?: string;
  className?: string;
}

export function PublicHeader({ variant = "light", subtitle, className }: PublicHeaderProps) {
  const isDark = variant === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors",
        isDark
          ? "bg-[#061e57]/90 border-white/10"
          : "bg-white/95 border-gray-200/80",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer group opacity-100 hover:opacity-80 transition-opacity">
            <img
              src="/mcwilliams-logo.png"
              alt="McWilliams Media"
              className="h-7 w-auto object-contain"
              style={isDark ? {} : { filter: "brightness(0) saturate(100%) invert(12%) sepia(74%) saturate(1200%) hue-rotate(210deg)" }}
            />
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {subtitle && (
            <span className={cn(
              "text-xs tracking-[0.15em] uppercase font-medium hidden sm:block",
              isDark ? "text-white/40" : "text-[#3a4856]/50"
            )}>
              {subtitle}
            </span>
          )}
          <a
            href="https://mcwilliamsmedia.com"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-xs tracking-wider uppercase transition-colors hidden sm:block",
              isDark
                ? "text-white/35 hover:text-white/65"
                : "text-[#3a4856]/40 hover:text-[#061e57]"
            )}
          >
            mcwilliamsmedia.com
          </a>
        </div>
      </div>
    </header>
  );
}
