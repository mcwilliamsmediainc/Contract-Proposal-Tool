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
          ? "bg-zinc-950/90 border-zinc-800/70"
          : "bg-white/90 border-gray-200",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div
              className={cn(
                "w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-base flex-shrink-0 transition-opacity group-hover:opacity-80",
                isDark
                  ? "bg-white text-black"
                  : "bg-blue-600 text-white"
              )}
            >
              M
            </div>
            <div className="flex flex-col leading-none">
              <span
                className={cn(
                  "font-bold text-sm tracking-tight leading-none",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                McWilliams Media
              </span>
              {subtitle ? (
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-widest uppercase mt-0.5",
                    isDark ? "text-zinc-500" : "text-gray-400"
                  )}
                >
                  {subtitle}
                </span>
              ) : (
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-widest uppercase mt-0.5",
                    isDark ? "text-zinc-500" : "text-gray-400"
                  )}
                >
                  Strategic Portal
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="https://mcwilliamsmedia.com"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-xs font-mono tracking-wider uppercase transition-colors hidden sm:block",
              isDark
                ? "text-zinc-500 hover:text-zinc-300"
                : "text-gray-400 hover:text-gray-700"
            )}
          >
            mcwilliamsmedia.com
          </a>
        </div>
      </div>
    </header>
  );
}
