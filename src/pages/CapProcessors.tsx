import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Layers,
  Thermometer,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Server
} from 'lucide-react';
import { capEngine } from '../services/capEngine';
import { ProcessorCore, ProcessorId, ProcessorTask } from '../types';

export const CapProcessors: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [processors, setProcessors] = useState<Record<ProcessorId, ProcessorCore>>(capEngine.getProcessors());
  const [taskQueue, setTaskQueue] = useState<ProcessorTask[]>(capEngine.getTaskQueue());
  const [selectedProcessor, setSelectedProcessor] = useState<ProcessorId>('CPU-2');

  const refresh = () => {
    setProcessors(capEngine.getProcessors());
    setTaskQueue(capEngine.getTaskQueue());
  };

  useEffect(() => {
    refresh();
    const unsub = capEngine.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleTriggerProcessor = (procId: ProcessorId) => {
    if (procId === 'CPU-1') {
      capEngine.recordProcessorActivity('CPU-1', 'ENTRY_REGISTER', 'Concurrent Plate Ingestion: Reg DL-01-TEST', 400, 'DL-01-TEST');
    } else if (procId === 'CPU-2') {
      capEngine.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', 'Critical Section: Mutex Lock on Slot Table', 450, 'MH-02-DEMO', 'A-104');
    } else if (procId === 'CPU-3') {
      capEngine.recordProcessorActivity('CPU-3', 'EXIT_PROCESS', 'Exit Checkout & Duration Dwell Calculation', 350, 'KA-03-TEST');
    } else if (procId === 'CPU-4') {
      capEngine.recordProcessorActivity('CPU-4', 'BILLING_CALCULATE', 'Revenue Rollup & Cryptographic Invoice Hash', 300);
    }
  };

  const handleTriggerAllConcurrently = () => {
    handleTriggerProcessor('CPU-1');
    handleTriggerProcessor('CPU-2');
    handleTriggerProcessor('CPU-3');
    handleTriggerProcessor('CPU-4');
  };

  const currentProc = processors[selectedProcessor];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                CAP MULTIPROCESSOR ARCHITECTURE &bull; MIMD MODEL
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Quad-Core Multiprocessor Control Center</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Simulates 4 independent processor cores handling vehicle registration, thread-safe slot allocation, checkout release, and financial billing concurrently.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerAllConcurrently}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Simulate All 4 Cores Concurrently</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Processors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.values(processors) as ProcessorCore[]).map(proc => {
          const isSelected = selectedProcessor === proc.id;
          const isBusy = proc.status === 'Busy';

          return (
            <div
              key={proc.id}
              onClick={() => setSelectedProcessor(proc.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-xl ring-2 ring-cyan-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isBusy ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-slate-800 text-cyan-400'}`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-white text-sm">{proc.id}</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{proc.role}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isBusy
                      ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                      : 'bg-slate-800 text-emerald-400'
                  }`}>
                    {proc.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {proc.description}
                </p>

                {/* Utilization meter */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Core Utilization</span>
                    <span className="text-cyan-400 font-bold">{proc.utilization}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${proc.utilization}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-center">
                  <div>
                    <div className="text-slate-500">Tasks</div>
                    <div className="text-white font-bold">{proc.tasksCompleted}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Cycles</div>
                    <div className="text-cyan-300 font-bold">{proc.clockCycles}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Temp</div>
                    <div className="text-amber-400 font-bold">{proc.temperature}°C</div>
                  </div>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerProcessor(proc.id);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 text-cyan-400 fill-current" />
                  <span>Execute Task on {proc.id}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Processor Architecture Details: Registers & Bus Interconnect */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: CPU Internal Register & Pipeline State */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {currentProc.name} Internal Architecture
                </h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  von Neumann Model
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time register contents, ALU state, and bus interface unit (BIU).
              </p>
            </div>
          </div>

          {/* CPU Registers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            
            {/* PC Register */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>PC (Program Counter)</span>
                <span className="text-[10px] text-cyan-400">32-bit</span>
              </div>
              <div className="text-base font-bold text-white">{currentProc.registers.PC}</div>
              <p className="text-[10px] text-slate-500 mt-1">Holds next instruction memory address</p>
            </div>

            {/* IR Register */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono sm:col-span-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>IR (Instruction Register)</span>
                <span className="text-[10px] text-emerald-400">Decoded</span>
              </div>
              <div className="text-sm font-bold text-emerald-400 truncate">{currentProc.registers.IR}</div>
              <p className="text-[10px] text-slate-500 mt-1">Current opcode being executed by Core ALU</p>
            </div>

            {/* MAR */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>MAR (Memory Address)</span>
                <span className="text-[10px] text-indigo-400">Address Bus</span>
              </div>
              <div className="text-sm font-bold text-indigo-300">{currentProc.registers.MAR}</div>
              <p className="text-[10px] text-slate-500 mt-1">Slot data address sent to RAM/Cache</p>
            </div>

            {/* MDR */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>MDR (Memory Data)</span>
                <span className="text-[10px] text-purple-400">Data Bus</span>
              </div>
              <div className="text-sm font-bold text-purple-300">{currentProc.registers.MDR}</div>
              <p className="text-[10px] text-slate-500 mt-1">Slot state/plate payload buffered</p>
            </div>

            {/* ACC / ALU */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>ACC (Accumulator)</span>
                <span className="text-[10px] text-amber-400">ALU Result</span>
              </div>
              <div className="text-sm font-bold text-amber-300">{currentProc.registers.ACC}</div>
              <p className="text-[10px] text-slate-500 mt-1">Arithmetic/duration temporary value</p>
            </div>

          </div>

          {/* System Bus Interconnect Schematic */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="text-slate-300 font-bold flex items-center justify-between">
              <span>Shared Multiprocessor Interconnect & Bus Snooping</span>
              <span className="text-[10px] text-cyan-400">PCIe / QuickPath Interconnect</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-24 text-[10px] text-slate-400">Control Bus:</span>
                <div className="flex-1 bg-cyan-950/60 border border-cyan-800/80 px-3 py-1 rounded text-cyan-300 text-[11px] flex justify-between">
                  <span>LOCK # / MEM_READ / MEM_WRITE</span>
                  <span className="text-[10px] text-cyan-400">Active High</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-24 text-[10px] text-slate-400">Address Bus:</span>
                <div className="flex-1 bg-indigo-950/60 border border-indigo-800/80 px-3 py-1 rounded text-indigo-300 text-[11px] flex justify-between">
                  <span>{currentProc.registers.MAR} &rarr; L1/L2 Cache Controller</span>
                  <span className="text-[10px] text-indigo-400">32-Bit Unicast</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-24 text-[10px] text-slate-400">Data Bus:</span>
                <div className="flex-1 bg-purple-950/60 border border-purple-800/80 px-3 py-1 rounded text-purple-300 text-[11px] flex justify-between">
                  <span>{currentProc.registers.MDR} &harr; ConcurrentHashMap RAM</span>
                  <span className="text-[10px] text-purple-400">64-Bit Bidirectional</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Task Queue & Thread Pool Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Processor Task Queue</h3>
              <p className="text-xs text-slate-400">ExecutorService Threadpool Dispatch</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {taskQueue.length} Logs
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {taskQueue.slice(0, 10).map(t => (
              <div
                key={t.taskId}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">{t.processorId}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    t.status === 'RUNNING'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] truncate">{t.details}</div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{new Date(t.startTime).toLocaleTimeString()}</span>
                  <span>Duration: {t.durationMs}ms</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('benchmark')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Run Multiprocessor Speedup Benchmark</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
