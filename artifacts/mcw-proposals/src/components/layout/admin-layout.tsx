import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, ChevronLeft, ChevronRight, Menu, BookUser, CreditCard, LogOut, FileText, XCircle, UserPlus, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/proposals", label: "Proposals", icon: FileText },
  { href: "/admin/contracts", label: "Contracts", icon: FileText },
  { href: "/admin/onboarding", label: "Onboarding", icon: Users },
  { href: "/admin/leads", label: "Leads", icon: UserPlus },
  { href: "/admin/clients", label: "Clients", icon: BookUser },
  { href: "/admin/lead-capture", label: "Lead Capture", icon: Radar },
  { href: "/admin/payment-link", label: "Update Payment Info", icon: CreditCard },
  { href: "/admin/cancellations", label: "Client Cancellation", icon: XCircle },
];

const SIDEBAR_BG = "bg-[#061e57]";
const SIDEBAR_BORDER = "border-[#0d2a6b]";

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn(
      "flex items-center border-b h-[57px] flex-shrink-0 relative",
      SIDEBAR_BORDER,
      collapsed ? "justify-center px-0" : "px-5"
    )}>
      {collapsed ? (
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#b3cee1", letterSpacing: ".04em", lineHeight: 1 }}>m</span>
      ) : (
        <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-8 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
      )}
    </div>
  );
}

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.fullName || user?.firstName || "Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("border-t p-2", SIDEBAR_BORDER, collapsed ? "flex flex-col items-center gap-1 py-3" : "")}>
      <div className={cn(
        "flex items-center gap-2.5 rounded-md",
        collapsed ? "justify-center px-0 py-1" : "px-3 py-2"
      )}>
        <div className="w-7 h-7 rounded-full bg-[#b3cee1]/20 border border-[#b3cee1]/30 flex items-center justify-center text-[#b3cee1] font-bold text-xs flex-shrink-0">
          {initials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 truncate">{displayName}</p>
            <p className="text-[11px] text-white/35 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        )}
      </div>
      <button
        onClick={() => signOut({ redirectUrl: "/" })}
        title="Sign out"
        className={cn(
          "flex items-center gap-2 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-xs",
          collapsed ? "p-1.5 justify-center" : "w-full px-3 py-1.5"
        )}
      >
        <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
        {!collapsed && "Sign out"}
      </button>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className={cn(
        "flex-col transition-all duration-200 ease-in-out z-50 border-r",
        SIDEBAR_BG, SIDEBAR_BORDER,
        "hidden md:flex",
        collapsed ? "w-16" : "w-60",
      )}>
        {/* Logo */}
        <div className="relative">
          <SidebarLogo collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-[#0d2a6b] bg-[#061e57] flex items-center justify-center text-white/50 hover:text-white transition-colors shadow-md z-10"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 mt-2">
          {!collapsed && (
            <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-2 px-3 pt-1">
              Strategic Portal
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sm font-medium transition-all cursor-pointer",
                    collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/55 hover:bg-white/10 hover:text-white/90"
                  )}
                >
                  <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                  {!collapsed && item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <UserFooter collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-60 border-r flex flex-col z-50 transition-transform duration-200 md:hidden",
        SIDEBAR_BG, SIDEBAR_BORDER,
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn("flex items-center px-5 border-b h-14", SIDEBAR_BORDER)}>
          <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-7 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        </div>
        <nav className="flex-1 p-2 space-y-0.5 mt-2">
          <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-2 px-3 pt-1">Strategic Portal</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div onClick={() => setMobileOpen(false)} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer",
                  isActive ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10 hover:text-white/90"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <UserFooter collapsed={false} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-6 w-auto object-contain" style={{ filter: "brightness(0) saturate(100%) invert(12%) sepia(74%) saturate(1200%) hue-rotate(210deg)" }} />
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-auto bg-background p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
