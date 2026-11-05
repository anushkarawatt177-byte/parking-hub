import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  AlertOctagon,
  CheckCircle2,
  Zap,
  Play,
  RotateCcw,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { capEngine } from '../services/capEngine';
import { parkingStore } from '../services/parkingStore';
import { SynchronizationMode, SchedulingAlgorithm } from '../types';

export const SyncAndLocks: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [syncMode, setSyncMode] = useState<SynchronizationMode>(capEngine.getSyncMode());
  const [schedulingAlgo, setSchedulingAlgo] = useState<SchedulingAlgorithm>('Work-Stealing (Least Loaded)');
  const [logs, setLogs] = useState(capEngine.getRaceConditionLogs());
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [lastSimResult, setLastSimResult] = useState<{ raceOccurred: boolean; slotId: string; details: string } | null>(null);

  const refresh = () => {
    setSyncMode(capEngine.getSyncMode());
    setLogs(capEngine.getRaceConditionLogs());
  };

  useEffect(() => {
    refresh();
    const unsub = capEngine.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleModeChange = (mode: SynchronizationMode) => {
    setSyncMode(mode);
    capEngine.setSyncMode(mode);
  };

  const handleRunRaceConditionTest = async () => {
    setIsRunningSim(true);
    setLastSimResult(null);

    // Pulse activity on CPU-2
    capEngine.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', 'Concurrency Stress: Spawning Thread-1 & Thread-2', 450);

    await new Promise(r => setTimeout(r, 300));
    const result = await capEngine.runConcurrentDoubleAllocationSimulation();
    setLastSimResult(result);
    setIsRunningSim(false);
  };

  const handleClearLogs = () => {
    capEngine.clearRaceConditionLogs();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                CAP CONCURRENCY & SYNCHRONIZATION LAB
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                Race Condition vs Mutex Locks
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Synchronization, Scheduling & Load Balancing</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Demonstrates the critical CAP phenomenon: how unsynchronized concurrent threads cause race conditions and double-booking, and how Mutex locks or hardware CAS primitives eliminate collision.
            </p>
          </div>
        </div>
      </div>

      {/* Synchronization Mode Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Mode 1: Synchronized Mutex */}
        <div
          onClick={() => handleModeChange('Synchronized-Mutex')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            syncMode === 'Synchronized-Mutex'
              ? 'bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-sm">Synchronized Mutex</span>
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uses Java <code className="text-indigo-300 font-mono">synchronized</code> blocks or <code className="text-indigo-300 font-mono">ReentrantLock</code>. Serializes access to parking slot status so only one thread allocates at a time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Thread-Safe
            </span>
            <span className="text-slate-500">Pessimistic Lock</span>
          </div>
        </div>

        {/* Mode 2: Atomic CAS (Compare-And-Swap) */}
        <div
          onClick={() => handleModeChange('Atomic-CAS')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            syncMode === 'Atomic-CAS'
              ? 'bg-slate-900 border-cyan-500 shadow-xl ring-2 ring-cyan-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-sm">Atomic CAS Primitive</span>
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hardware level <code className="text-cyan-300 font-mono">CMPXCHG</code> atomic instruction. Verifies slot version before commit without thread blocking or kernel context switches.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Lock-Free & Safe
            </span>
            <span className="text-slate-500">Optimistic CAS</span>
          </div>
        </div>

        {/* Mode 3: Unsynchronized Race Condition */}
        <div
          onClick={() => handleModeChange('Unsynchronized (Race Condition Demo)')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            syncMode === 'Unsynchronized (Race Condition Demo)'
              ? 'bg-rose-950/40 border-rose-500 shadow-xl ring-2 ring-rose-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-900/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-rose-300 text-sm">Unsynchronized (Race Bug)</span>
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Demonstrates race condition flaw: Two threads execute read & write interleaved without locks, assigning the same slot to two different vehicles!
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-900/50 flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" /> Race Hazard Active
            </span>
            <span className="text-slate-500">Bug Demo</span>
          </div>
        </div>

      </div>

      {/* Interactive Simulation Experiment Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Concurrency Experiment Runner */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Concurrent Slot Allocation Experiment</h3>
              <p className="text-xs text-slate-400">
                Spawns Thread 1 & Thread 2 at the exact same millisecond to allocate a parking bay.
              </p>
            </div>

            <button
              onClick={handleRunRaceConditionTest}
              disabled={isRunningSim}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-transform active:scale-95 ${
                syncMode === 'Unsynchronized (Race Condition Demo)'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunningSim ? 'Executing Concurrent Threads...' : 'Fire Concurrent Allocation Test'}</span>
            </button>
          </div>

          {/* Test Result Banner */}
          {lastSimResult && (
            <div className={`p-5 rounded-xl border space-y-2 animate-in fade-in ${
              lastSimResult.raceOccurred
                ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                : 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold font-mono text-sm">
                {lastSimResult.raceOccurred ? (
                  <>
                    <AlertOctagon className="w-5 h-5 text-rose-400" />
                    <span>RACE CONDITION DETECTED! (Double-Booking Bug)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>SYNCHRONIZATION SUCCESS: Thread-Safe Serialization</span>
                  </>
                )}
              </div>
              <p className="text-xs font-mono leading-relaxed">
                {lastSimResult.details}
              </p>
            </div>
          )}

          {/* Execution History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Concurrency Event Log ({logs.length})
              </span>
              <button
                onClick={handleClearLogs}
                className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Clear History
              </button>
            </div>

            {logs.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1"
                  >
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>{log.timestamp}</span>
                      <span>Target Slot: {log.slotId}</span>
                    </div>
                    <div className="text-white font-medium">{log.outcome}</div>
                    <div className="text-[10px] text-slate-400 flex gap-4">
                      <span>{log.thread1}</span>
                      <span>{log.thread2}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
                No concurrency experiments recorded yet. Click "Fire Concurrent Allocation Test" above.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Task Scheduler & Load Balancing Configuration */}
        <div className="space-y-6">
          
          {/* Scheduling Algorithm */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Multiprocessor Task Scheduler</h3>
            <p className="text-xs text-slate-400">
              Distributes incoming parking operations among processor cores.
            </p>

            <div className="space-y-2">
              {[
                { id: 'Work-Stealing (Least Loaded)', name: 'Work-Stealing (Least Loaded)', desc: 'Idle cores dynamically steal tasks from busy queues for optimal load balancing.' },
                { id: 'Round-Robin', name: 'Round-Robin (Static)', desc: 'Cyclically assigns incoming requests CPU-1 -> CPU-2 -> CPU-3 -> CPU-4.' },
                { id: 'Priority-Based', name: 'Priority-Based Queue', desc: 'Prioritizes checkout exits and lock allocations over entry registrations.' },
              ].map(algo => (
                <button
                  key={algo.id}
                  onClick={() => setSchedulingAlgo(algo.id as any)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    schedulingAlgo === algo.id
                      ? 'bg-indigo-950/70 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{algo.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{algo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theoretical CAP Viva Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 font-mono text-xs">
            <div className="text-cyan-400 font-bold text-sm">Critical Section Problem in CAP</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When two concurrent threads execute:
            </p>
            <pre className="p-2.5 rounded bg-slate-950 text-indigo-300 text-[10px] overflow-x-auto border border-slate-800">
{`// Critical Section (Unsynchronized):
if (slot.status == 'Available') {
  // Context switch happens here!
  slot.status = 'Occupied';
  slot.vehicle = currentVehicle;
}`}
            </pre>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Without mutual exclusion (Mutex), a thread context switch before writing leads to inconsistent state (Race Hazard).
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
