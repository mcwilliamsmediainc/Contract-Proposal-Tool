import React from "react";
import { 
  LayoutDashboard, 
  FileText, 
  UserPlus, 
  Settings, 
  Plus,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock,
  CircleDashed,
  ArrowRight
} from "lucide-react";

export function CrispWhite() {
  return (
    <div className="flex h-[800px] w-[1280px] bg-white text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-lg">
            M
          </div>
          <span className="font-semibold text-lg tracking-tight">McWilliams</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
            <LayoutDashboard size={18} className="text-blue-600" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium text-sm transition-colors">
            <FileText size={18} />
            New Proposal
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium text-sm transition-colors">
            <UserPlus size={18} />
            Onboarding
          </a>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm border border-gray-200">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">Admin</span>
              <span className="text-xs text-gray-500">admin@mcw.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <header className="px-10 py-8 flex justify-between items-end border-b border-gray-100">
          <div>
            <h2 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Strategic Pipeline Overview</h2>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Command Center</h1>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} />
            Initialize Proposal
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Briefcase size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-semibold text-gray-900 mb-1">12</h3>
              <p className="text-sm text-gray-500 font-medium">Total Assets</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <TrendingUp size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-semibold text-gray-900 mb-1">$127,500</h3>
              <p className="text-sm text-gray-500 font-medium">Active Pipeline</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-semibold text-gray-900 mb-1">66.7%</h3>
              <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Eye size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-semibold text-gray-900 mb-1">34</h3>
              <p className="text-sm text-gray-500 font-medium">Total Engagement (views)</p>
            </div>
          </div>

          {/* Proposals Table */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Strategies</h3>
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Apex Digital</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">apex.io</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">$15,000</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 size={12} /> Accepted
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">8 views</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">Apr 28, 2026</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-500 hover:text-blue-600 transition-colors">Edit</button>
                        <span className="text-gray-300">·</span>
                        <button className="text-gray-500 hover:text-blue-600 transition-colors">Preview</button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Stratos Media</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">stratos.co</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">$22,500</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock size={12} /> Sent
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">3 views</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">Apr 25, 2026</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-500 hover:text-blue-600 transition-colors">Edit</button>
                        <span className="text-gray-300">·</span>
                        <button className="text-gray-500 hover:text-blue-600 transition-colors">Preview</button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">NovaBrand</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">novabrand.com</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">$9,750</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        <CircleDashed size={12} /> Draft
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">0 views</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">Apr 20, 2026</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-500 hover:text-blue-600 transition-colors">Edit</button>
                        <span className="text-gray-300">·</span>
                        <button className="text-gray-500 hover:text-blue-600 transition-colors">Preview</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
