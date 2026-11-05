import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Clock,
  Car,
  Bell,
  RefreshCw,
  Activity
} from 'lucide-react';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  userRole: 'ADMIN' | 'OPERATOR' | 'PROFESSOR';
  setUserRole: (role: 'ADMIN' | 'OPERATOR' | 'PROFESSOR') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  userRole,
  setUserRole
}) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [slotsAvailable, setSlotsAvailable] = useState(0);
  const [slotsOccupied, setSlotsOccupied] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updateStats = () => {
    const slots = parkingStore.getSlots();
    setSlotsAvailable(slots.filter(s => s.status === 'Available').length);
    setSlotsOccupied(slots.filter(s => s.status === 'Occupied').length);
  };

  useEffect(() => {
    updateStats();
    const unsub1 = parkingStore.subscribe(updateStats);
    const unsub2 = capEngine.subscribe(updateStats);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    capEngine.recordProcessorActivity('CPU-1', 'CACHE_FLUSH', 'L1/L2 Cache Write-Through Sync to MySQL', 400);
    setTimeout(() => {
      setIsSyncing(false);
      updateStats();
    }, 450);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                AutoPark CAP
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Quad-Core
              </span>
            </div>
            <p className="text-xs text-slate-400">Multiprocessor Smart Parking Platform</p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          {/* Real-time Available Slots */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Slots:</span>
            <span className="text-emerald-400 font-bold">{slotsAvailable} Free</span>
            <span className="text-slate-500">/</span>
            <span className="text-rose-400 font-bold">{slotsOccupied} Busy</span>
          </div>

          {/* Multiprocessor Cores status */}
          <div 
            onClick={() => onNavigate('cap-processors')}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 transition-colors"
            title="4 Active CPU Cores"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">CPUs:</span>
            <span className="text-cyan-400 font-semibold">4 / 4 Online</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1.5 text-slate-400 px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-300">{time}</span>
          </div>
        </div>

        {/* Actions & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Flush Cache / Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs flex items-center gap-1.5"
            title="Broadcast Cache Invalidate & Flush to DB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden lg:inline text-xs font-medium">Sync Cache</span>
          </button>

          {/* Role Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setUserRole('ADMIN')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                userRole === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setUserRole('OPERATOR')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                userRole === 'OPERATOR'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => setUserRole('PROFESSOR')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                userRole === 'PROFESSOR'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CAP Prof
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
