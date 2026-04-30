import { Link, useLocation } from "wouter";
import { useAuth, UserButton } from "@clerk/react";
import { LayoutDashboard, FileText, Plus, Users, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/proposals/new", label: "New Proposal", icon: Plus },
  { href: "/admin/onboarding", label: "Onboarding", icon: Users },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30 dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-border h-[72px]">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-mono font-bold text-lg">
            M
          </div>
          <span className="font-bold tracking-tight">MCWILLIAMS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-mono text-muted-foreground mb-4 px-2">STRATEGIC PORTAL</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
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
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded" } }} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-mono font-bold text-lg">
              M
            </div>
          </div>
          <UserButton />
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