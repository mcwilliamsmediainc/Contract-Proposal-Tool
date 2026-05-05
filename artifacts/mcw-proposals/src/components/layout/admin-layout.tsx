import { Link, useLocation } from "wouter";
import { LayoutDashboard, FilePlus2, Users, FileSignature, ChevronLeft, ChevronRight, Menu, BookUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/proposals/new", label: "New Proposal", icon: FilePlus2 },
  { href: "/admin/contracts", label: "Contracts", icon: FileSignature },
  { href: "/admin/onboarding", label: "Onboarding", icon: Users },
  { href: "/admin/clients", label: "Clients", icon: BookUser },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "flex-col border-r border-border bg-card transition-all duration-200 ease-in-out z-50",
        "hidden md:flex",
        collapsed ? "w-16" : "w-64",
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-border h-[57px] flex-shrink-0 relative",
          collapsed ? "justify-center px-0" : "px-5 gap-3"
        )}>
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-mono font-bold text-lg flex-shrink-0">
            M
          </div>
          {!collapsed && (
            <span className="font-bold tracking-tight text-sm truncate">MCWILLIAMS</span>
          )}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm z-10"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 mt-1">
          {!collapsed && (
            <div className="text-xs font-mono text-muted-foreground mb-3 px-3 pt-2">STRATEGIC PORTAL</div>
          )}
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className={cn("border-t border-border p-2", collapsed ? "flex justify-center py-3" : "")}>
          <div className={cn(
            "flex items-center gap-3 rounded-md",
            collapsed ? "justify-center px-0 py-1" : "px-3 py-2"
          )}>
            <div className="w-7 h-7 bg-primary/20 rounded flex items-center justify-center text-primary font-mono font-bold text-xs flex-shrink-0">
              M
            </div>
            {!collapsed && <span className="text-sm font-medium text-muted-foreground">Admin</span>}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 border-r border-border bg-card flex flex-col z-50 transition-transform duration-200 md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-5 border-b border-border h-14">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-mono font-bold text-lg">M</div>
          <span className="font-bold tracking-tight text-sm">MCWILLIAMS</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 mt-1">
          <div className="text-xs font-mono text-muted-foreground mb-3 px-3 pt-2">STRATEGIC PORTAL</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div onClick={() => setMobileOpen(false)} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 bg-primary/20 rounded flex items-center justify-center text-primary font-mono font-bold text-xs">M</div>
            <span className="text-sm font-medium text-muted-foreground">Admin</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-primary-foreground font-mono font-bold text-sm">M</div>
            <span className="font-bold text-sm tracking-tight">McWilliams Media</span>
          </div>
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
