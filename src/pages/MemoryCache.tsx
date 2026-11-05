import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  Cpu,
  Layers,
  Activity,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';
import { capEngine } from '../services/capEngine';
import { parkingStore } from '../services/parkingStore';
import { CacheLine, MemoryHierarchyStats, MESIState } from '../types';

export const MemoryCache: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [cacheLines, setCacheLines] = useState<CacheLine[]>(capEngine.getL1Cache());
  const [stats, setStats] = useState<MemoryHierarchyStats>(capEngine.getCacheStats());
  const [testSlotId, setTestSlotId] = useState('A-101');
  const [lastAccessLog, setLastAccessLog] = useState<{ message: string; latency: string; level: string } | null>(null);

  const refresh = () => {
    setCacheLines(capEngine.getL1Cache());
    setStats(capEngine.getCacheStats());
  };

  useEffect(() => {
    refresh();
    const unsub = capEngine.subscribe(refresh);
    return () => unsub();
  }, []);

  const totalL1Accesses = stats.l1Hits + stats.l1Misses;
  const l1HitRatio = totalL1Accesses > 0 ? Math.round((stats.l1Hits / totalL1Accesses) * 1000) / 10 : 92.5;
  const missRate = (100 - l1HitRatio) / 100;
  
  // AMAT Formula: AMAT = Hit_Time + (Miss_Rate * Miss_Penalty)
  // L1 Hit Time = 1ns, Miss Penalty (RAM) = 100ns
  const amatNs = Math.round((stats.l1LatencyNs + (missRate * stats.ramLatencyNs)) * 10) / 10;

  const handleTestRead = () => {
    const res = capEngine.accessSlotCache(testSlotId, false);
    setLastAccessLog({
      message: res.hit
        ? `CACHE HIT on ${res.level}: Slot ${testSlotId} retrieved from fast SRAM.`
        : `CACHE MISS on L1/L2: Fetched ${testSlotId} from RAM ConcurrentHashMap.`,
      latency: `${res.latencyNs} ns`,
      level: res.level
    });
  };

  const handleTestWrite = () => {
    capEngine.accessSlotCache(testSlotId, true);
    capEngine.updateCacheLine(testSlotId, 'Occupied', `SIM-${Math.floor(100 + Math.random() * 900)}`);
    setLastAccessLog({
      message: `CACHE WRITE on Slot ${testSlotId}: Marked Modified (M) in L1. MESI Bus Invalidate broadcasted to other cores.`,
      latency: '1.2 ns (Write-Back Buffer)',
      level: 'L1'
    });
  };

  const handleInvalidate = () => {
    capEngine.invalidateCacheLine(testSlotId);
    setLastAccessLog({
      message: `MESI INVALIDATE: Slot ${testSlotId} line state set to Invalid (I). Core forced to fetch fresh copy on next access.`,
      latency: '3.5 ns (Bus Invalidate Snooping)',
      level: 'Broadcast'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                CAP MEMORY HIERARCHY & CACHE COHERENCE
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                MESI Protocol
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Memory Hierarchy & MESI Cache Coherence</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Visualizes multi-tiered memory access from 1ns L1 SRAM to 10ms MySQL disk storage, and guarantees data consistency across multiprocessor cores via the MESI protocol.
            </p>
          </div>
        </div>
      </div>

      {/* Memory Pyramid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* L1 Cache */}
        <div className="p-4 rounded-xl bg-slate-900 border border-teal-800/60 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-teal-400 font-mono font-bold mb-2">
              <span>Level 1 (L1) Cache</span>
              <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">1 ns</span>
            </div>
            <div className="text-xs text-slate-300 font-semibold">On-Chip SRAM per Core</div>
            <p className="text-[11px] text-slate-500 mt-1">Frequently accessed parking slot availability table.</p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 font-mono text-xs flex justify-between">
            <span className="text-slate-400">Hits: <span className="text-teal-300 font-bold">{stats.l1Hits}</span></span>
            <span className="text-slate-400">Misses: <span className="text-rose-400 font-bold">{stats.l1Misses}</span></span>
          </div>
        </div>

        {/* L2 Cache */}
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/60 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono font-bold mb-2">
              <span>Level 2 (L2) Cache</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">10 ns</span>
            </div>
            <div className="text-xs text-slate-300 font-semibold">Shared Intermediate Cache</div>
            <p className="text-[11px] text-slate-500 mt-1">Shared between CPU-1..4 to reduce main bus traffic.</p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 font-mono text-xs flex justify-between">
            <span className="text-slate-400">Hits: <span className="text-cyan-300 font-bold">{stats.l2Hits}</span></span>
            <span className="text-slate-400">Misses: <span className="text-rose-400 font-bold">{stats.l2Misses}</span></span>
          </div>
        </div>

        {/* Main Memory (RAM) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-indigo-800/60 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-indigo-400 font-mono font-bold mb-2">
              <span>Main Memory (RAM)</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">100 ns</span>
            </div>
            <div className="text-xs text-slate-300 font-semibold">ConcurrentHashMap Pool</div>
            <p className="text-[11px] text-slate-500 mt-1">Thread-safe active vehicle & session memory heap.</p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 font-mono text-xs flex justify-between">
            <span className="text-slate-400">Accesses:</span>
            <span className="text-indigo-300 font-bold">{stats.ramAccesses} fetches</span>
          </div>
        </div>

        {/* Secondary Storage (MySQL Disk) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-purple-800/60 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-purple-400 font-mono font-bold mb-2">
              <span>Secondary Storage</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">10 ms</span>
            </div>
            <div className="text-xs text-slate-300 font-semibold">Persistent MySQL 8.0 Disk</div>
            <p className="text-[11px] text-slate-500 mt-1">Permanent transactional audit & financial tables.</p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 font-mono text-xs flex justify-between">
            <span className="text-slate-400">Disk Writes:</span>
            <span className="text-purple-300 font-bold">{stats.diskWrites} commits</span>
          </div>
        </div>

      </div>

      {/* AMAT & Coherence Protocol Mathematical Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* AMAT */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase font-bold">Average Memory Access Time (AMAT)</div>
          <div className="text-2xl font-bold text-teal-400 font-mono">{amatNs} ns</div>
          <p className="text-[10px] text-slate-500">
            AMAT = T_L1 + (MissRate &times; Penalty_RAM) = 1 + ({missRate.toFixed(3)} &times; 100)
          </p>
        </div>

        {/* L1 Hit Ratio */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase font-bold">L1 Cache Hit Ratio</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{l1HitRatio}%</div>
          <p className="text-[10px] text-slate-500">
            {stats.l1Hits} hits / {totalL1Accesses} total L1 memory probes
          </p>
        </div>

        {/* MESI Invalidation Broadcasts */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase font-bold">MESI Coherence Snooping Broadcasts</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">{stats.coherenceInvalidations} Events</div>
          <p className="text-[10px] text-slate-500">
            Write-Invalidate protocol broadcasts on slot occupancy change
          </p>
        </div>

      </div>

      {/* Interactive Cache Probe Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Cache Lines Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Active L1 Cache Lines & MESI State Machine</h3>
              <p className="text-xs text-slate-400">16-Line Direct-Mapped / Set-Associative Slot Table Cache</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">M: Modified</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">E: Exclusive</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">S: Shared</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">I: Invalid</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Slot ID</th>
                  <th className="py-2.5 px-3">Tag Address</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">MESI State</th>
                  <th className="py-2.5 px-3">Dirty?</th>
                  <th className="py-2.5 px-3">Accesses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {cacheLines.map(line => {
                  const isModified = line.mesiState === 'Modified';
                  const isShared = line.mesiState === 'Shared';
                  const isInvalid = line.mesiState === 'Invalid';

                  return (
                    <tr key={line.slotId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{line.slotId}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{line.tag}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          line.data.status === 'Occupied'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {line.data.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isModified
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : isShared
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : isInvalid
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {line.mesiState}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] ${line.dirty ? 'text-amber-400 font-bold' : 'text-slate-600'}`}>
                          {line.dirty ? 'DIRTY (1)' : 'CLEAN (0)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{line.accessCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Interactive Memory Probe Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base">Cache Controller Operations</h3>
          <p className="text-xs text-slate-400">
            Probe memory hierarchies manually or simulate multi-core cache invalidation.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Target Slot ID</label>
              <select
                value={testSlotId}
                onChange={e => setTestSlotId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              >
                {cacheLines.map(c => (
                  <option key={c.slotId} value={c.slotId}>
                    {c.slotId} ({c.data.status} - MESI: {c.mesiState})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={handleTestRead}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Simulate Bus Read (BusRd)</span>
              </button>

              <button
                onClick={handleTestWrite}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulate Bus Write & Invalidate (BusRdX)</span>
              </button>

              <button
                onClick={handleInvalidate}
                className="w-full py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Force MESI Invalidate (I State)</span>
              </button>
            </div>

            {/* Access Result Banner */}
            {lastAccessLog && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 animate-in fade-in font-mono text-[11px]">
                <div className="flex justify-between text-cyan-400 font-bold">
                  <span>Level: {lastAccessLog.level}</span>
                  <span>Latency: {lastAccessLog.latency}</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {lastAccessLog.message}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
