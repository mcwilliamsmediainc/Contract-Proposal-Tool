import React from 'react';
import { LayoutDashboard, FileText, Settings, Plus, BarChart2, DollarSign, Activity, Eye, ChevronRight, MoreHorizontal } from 'lucide-react';
import './_group.css';

export function WarmSand() {
  return (
    <div className="warm-sand-theme w-full h-[800px] flex overflow-hidden text-[#1C1917] font-sans bg-[var(--bg-main)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#1C1917] text-white flex items-center justify-center font-playfair text-xl font-bold rounded">
              M
            </div>
            <span className="font-semibold text-lg tracking-tight">McWilliams</span>
          </div>

          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-[var(--border-subtle)]/50 text-[#1C1917] font-medium">
              <LayoutDashboard size={18} className="text-[var(--accent-amber)]" />
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--border-subtle)]/30 text-[var(--text-muted)] hover:text-[#1C1917] transition-colors">
              <FileText size={18} />
              New Proposal
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--border-subtle)]/30 text-[var(--text-muted)] hover:text-[#1C1917] transition-colors">
              <Settings size={18} />
              Onboarding
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)]">
          <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] flex items-center justify-center border border-[var(--border-subtle)]">
            A
          </div>
          <span className="font-medium">Admin</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-10 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="text-xs font-semibold tracking-widest text-[var(--text-muted)] mb-2">STRATEGIC PIPELINE OVERVIEW</div>
            <h1 className="font-playfair text-4xl font-semibold">Command Center</h1>
          </div>
          <button className="bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-white px-5 py-2.5 rounded shadow-sm flex items-center gap-2 font-medium transition-colors">
            <Plus size={18} />
            Initialize Proposal
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Assets" value="12" icon={<FileText size={20} className="text-[var(--text-muted)]" />} />
          <StatCard title="Active Pipeline" value="$127,500" icon={<DollarSign size={20} className="text-[var(--text-muted)]" />} />
          <StatCard title="Conversion Rate" value="66.7%" icon={<Activity size={20} className="text-[var(--text-muted)]" />} />
          <StatCard title="Total Engagement" value="34 views" icon={<Eye size={20} className="text-[var(--text-muted)]" />} />
        </div>

        {/* Table Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] mb-4">RECENT STRATEGIES</h2>
          <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/30">
                    <th className="px-6 py-4 font-semibold text-[var(--text-muted)]">CLIENT</th>
                    <th className="px-6 py-4 font-semibold text-[var(--text-muted)]">BUSINESS</th>
                    <th className="px-6 py-4 font-semibold text-[var(--text-muted)]">VALUE</th>
                    <th className="px-6 py-4 font-semibold text-[var(--text-muted)]">STATUS</th>
                    <th className="px-6 py-4 font-semibold text-[var(--text-muted)]">VIEWS</th>
                    <th className="px-6 py-4 font-semibold text-[var(--text-muted)]">DATE</th>
                    <th className="px-6 py-4 font-semibold text-[var(--text-muted)] text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  <TableRow 
                    client="Apex Digital"
                    business="apex.io"
                    value="$15,000"
                    status="ACCEPTED"
                    statusColor="bg-green-100 text-green-800 border-green-200"
                    views="8 views"
                    date="Apr 28, 2026"
                  />
                  <TableRow 
                    client="Stratos Media"
                    business="stratos.co"
                    value="$22,500"
                    status="SENT"
                    statusColor="bg-blue-100 text-blue-800 border-blue-200"
                    views="3 views"
                    date="Apr 25, 2026"
                  />
                  <TableRow 
                    client="NovaBrand"
                    business="novabrand.com"
                    value="$9,750"
                    status="DRAFT"
                    statusColor="bg-[var(--bg-sidebar)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                    views="0 views"
                    date="Apr 20, 2026"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg p-5 flex flex-col shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-[var(--text-muted)]">{title}</span>
        {icon}
      </div>
      <span className="text-3xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}

function TableRow({ client, business, value, status, statusColor, views, date }: any) {
  return (
    <tr className="hover:bg-[var(--bg-sidebar)]/50 transition-colors group">
      <td className="px-6 py-4 font-medium">{client}</td>
      <td className="px-6 py-4 text-[var(--text-muted)]">{business}</td>
      <td className="px-6 py-4 font-medium">{value}</td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-[var(--text-muted)]">{views}</td>
      <td className="px-6 py-4 text-[var(--text-muted)]">{date}</td>
      <td className="px-6 py-4 text-right space-x-3">
        <button className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-amber)] transition-colors">EDIT</button>
        <span className="text-[var(--border-subtle)]">·</span>
        <button className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-amber)] transition-colors">PREVIEW</button>
      </td>
    </tr>
  );
}
