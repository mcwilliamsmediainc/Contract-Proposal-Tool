import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  UserPlus, 
  Settings, 
  LogOut,
  TrendingUp,
  Briefcase,
  Eye,
  MoreHorizontal,
  Plus
} from 'lucide-react';

export default function SoftSlate() {
  return (
    <div className="flex h-[800px] w-[1280px] font-sans text-slate-800 overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <div className="w-64 flex flex-col justify-between border-r border-[#DDE4EE] bg-[#EEF2F7]">
        <div>
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-[#DDE4EE]/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
              <span className="font-semibold text-slate-900 tracking-tight">McWilliams Media</span>
            </div>
          </div>
          
          {/* Nav */}
          <nav className="p-4 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-indigo-600/10 text-indigo-700 font-medium">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors font-medium">
              <FileText className="w-5 h-5" />
              New Proposal
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors font-medium">
              <UserPlus className="w-5 h-5" />
              Onboarding
            </a>
          </nav>
        </div>
        
        {/* User / Bottom */}
        <div className="p-4 border-t border-[#DDE4EE]/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Admin</p>
              <p className="text-xs text-slate-500 truncate">admin@mcwilliams.com</p>
            </div>
            <Settings className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-500 mb-1">STRATEGIC PIPELINE OVERVIEW</p>
              <h1 className="text-3xl font-bold text-slate-900">Command Center</h1>
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Initialize Proposal
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">Total Assets</h3>
                <FileText className="w-5 h-5 text-indigo-600/70" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">12</p>
            </div>
            
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">Active Pipeline</h3>
                <Briefcase className="w-5 h-5 text-indigo-600/70" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">$127,500</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">Conversion Rate</h3>
                <TrendingUp className="w-5 h-5 text-indigo-600/70" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">66.7%</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">Total Engagement</h3>
                <Eye className="w-5 h-5 text-indigo-600/70" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">34 <span className="text-lg font-normal text-slate-400">views</span></p>
            </div>
          </div>

          {/* Table Section */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">RECENT STRATEGIES</h2>
          </div>
          
          <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Views</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5 font-medium text-slate-900">Apex Digital</td>
                  <td className="py-4 px-5 text-slate-500">apex.io</td>
                  <td className="py-4 px-5 font-medium text-slate-900">$15,000</td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      ACCEPTED
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-500">8 views</td>
                  <td className="py-4 px-5 text-slate-500">Apr 28, 2026</td>
                  <td className="py-4 px-5 text-right">
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Edit</button>
                    <span className="mx-2 text-slate-300">·</span>
                    <button className="text-xs font-medium text-slate-500 hover:text-slate-800 uppercase tracking-wider">Preview</button>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5 font-medium text-slate-900">Stratos Media</td>
                  <td className="py-4 px-5 text-slate-500">stratos.co</td>
                  <td className="py-4 px-5 font-medium text-slate-900">$22,500</td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      SENT
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-500">3 views</td>
                  <td className="py-4 px-5 text-slate-500">Apr 25, 2026</td>
                  <td className="py-4 px-5 text-right">
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Edit</button>
                    <span className="mx-2 text-slate-300">·</span>
                    <button className="text-xs font-medium text-slate-500 hover:text-slate-800 uppercase tracking-wider">Preview</button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5 font-medium text-slate-900">NovaBrand</td>
                  <td className="py-4 px-5 text-slate-500">novabrand.com</td>
                  <td className="py-4 px-5 font-medium text-slate-900">$9,750</td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      DRAFT
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-500">0 views</td>
                  <td className="py-4 px-5 text-slate-500">Apr 20, 2026</td>
                  <td className="py-4 px-5 text-right">
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Edit</button>
                    <span className="mx-2 text-slate-300">·</span>
                    <button className="text-xs font-medium text-slate-500 hover:text-slate-800 uppercase tracking-wider">Preview</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
