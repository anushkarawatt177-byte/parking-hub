import React from 'react';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Grid3X3,
  Receipt,
  BarChart3,
  Cpu,
  GitCommit,
  HardDrive,
  Lock,
  Gauge,
  Database,
  BookOpen,
  Settings,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const operationalItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'vehicle-entry', label: 'Vehicle Entry', icon: LogIn, badge: 'CPU-1' },
    { id: 'vehicle-exit', label: 'Vehicle Exit & Fees', icon: LogOut, badge: 'CPU-3' },
    { id: 'slot-management', label: 'Parking Slot Manager', icon: Grid3X3 },
    { id: 'billing', label: 'Billing & Receipts', icon: Receipt, badge: 'CPU-4' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const capItems = [
    { id: 'cap-processors', label: 'CAP 4-Core Processors', icon: Cpu, highlight: true },
    { id: 'pipeline', label: '5-Stage Pipelining', icon: GitCommit, badge: 'Hazard Sim' },
    { id: 'memory-cache', label: 'Memory & MESI Cache', icon: HardDrive, badge: 'Coherence' },
    { id: 'synchronization', label: 'Sync & Lock Lab', icon: Lock, badge: 'Race Demo' },
    { id: 'benchmark', label: 'Parallel Benchmarking', icon: Gauge, badge: 'Speedup' },
  ];

  const systemItems = [
    { id: 'database-schema', label: 'MySQL Database Schema', icon: Database },
    { id: 'cap-docs', label: 'CAP Architecture Guide', icon: BookOpen },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-slate-900/95 border-r border-slate-800 text-slate-300 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          
          {/* Section 1: Operations */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Parking Operations</span>
            </div>
            <nav className="space-y-1">
              {operationalItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: CAP Multiprocessor Architecture */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              <span>CAP Architecture Concepts</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono">SIM</span>
            </div>
            <nav className="space-y-1">
              {capItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/20 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-cyan-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-cyan-800/80 text-cyan-100' : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 3: Technical Docs & DB */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Database & Guide</span>
            </div>
            <nav className="space-y-1">
              {systemItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* Footer info card */}
        <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>CAP Architecture Spec</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            MIMD Multiprocessor &bull; Pipelined &bull; MESI Cache Coherent &bull; Mutex Protected
          </p>
        </div>
      </aside>
    </>
  );
};
