import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Cpu,
  Clock,
  Layers,
  Info
} from 'lucide-react';
import { capEngine, PIPELINE_STAGES } from '../services/capEngine';
import { PipelineVehicleInstruction, VehicleType, ParkingZone } from '../types';

export const PipelineSimulator: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [clockCycle, setClockCycle] = useState(capEngine.getPipelineClockCycle());
  const [instructions, setInstructions] = useState<PipelineVehicleInstruction[]>(capEngine.getPipelineInstructions());
  const [isRunning, setIsRunning] = useState(capEngine.isPipelineActive());
  const [speedMs, setSpeedMs] = useState(1000);
  const [stalls, setStalls] = useState(capEngine.getPipelineStalls());

  // Input state for injecting new vehicle into pipeline
  const [newReg, setNewReg] = useState('');
  const [newType, setNewType] = useState<VehicleType>('Car');

  const refresh = () => {
    setClockCycle(capEngine.getPipelineClockCycle());
    setInstructions(capEngine.getPipelineInstructions());
    setIsRunning(capEngine.isPipelineActive());
    setStalls(capEngine.getPipelineStalls());
  };

  useEffect(() => {
    refresh();
    const unsub = capEngine.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleStep = () => {
    capEngine.stepPipelineClock();
  };

  const handleToggleAuto = () => {
    if (isRunning) {
      capEngine.pauseAutoPipeline();
    } else {
      capEngine.startAutoPipeline(speedMs);
    }
  };

  const handleReset = () => {
    capEngine.resetPipeline();
  };

  const handleInjectVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const plate = newReg.trim() || `TEST-${Math.floor(100 + Math.random() * 900)}`;
    capEngine.addVehicleToPipeline(plate, newType);
    setNewReg('');
  };

  // Pipeline Math:
  // n = number of instructions
  // k = 5 stages
  const n = instructions.length || 1;
  const k = 5;
  const nonPipelinedCycles = n * k;
  const idealPipelinedCycles = k + n - 1;
  const actualCycles = clockCycle;
  const idealSpeedup = Math.round((nonPipelinedCycles / idealPipelinedCycles) * 100) / 100;
  const actualSpeedup = Math.round((nonPipelinedCycles / Math.max(actualCycles, 1)) * 100) / 100;
  const throughputIPC = Math.round((instructions.filter(i => i.currentStageIndex >= 4).length / Math.max(actualCycles, 1)) * 100) / 100;

  // Maximum cycles to display in the matrix table
  const maxDisplayCycles = Math.max(clockCycle, 8);
  const cycleHeaders = Array.from({ length: maxDisplayCycles }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                INSTRUCTION PIPELINING SIMULATOR
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                5 Stages (VR &bull; SAC &bull; PSA &bull; TG &bull; DS)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Concurrent Request Instruction Pipeline</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Demonstrates spatial parallelism where multiple vehicles pass through independent stages simultaneously per clock cycle, with automatic hazard detection.
            </p>
          </div>

          {/* Stepper Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleAuto}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pause Clock' : 'Auto Clock Tick'}</span>
            </button>

            <button
              onClick={handleStep}
              disabled={isRunning}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <SkipForward className="w-4 h-4 text-cyan-400" />
              <span>Step Cycle (+1)</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 cursor-pointer"
              title="Reset Pipeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 Stages Architecture Schematic */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {PIPELINE_STAGES.map((st, idx) => {
          // Count how many instructions are currently at this stage
          const currentInStage = instructions.filter(i => i.currentStageIndex === idx);

          return (
            <div
              key={st.code}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">Stage {idx + 1}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {st.code}
                  </span>
                </div>
                <div className="font-bold text-white text-xs leading-snug">{st.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">{st.hardwareUnit}</div>
              </div>

              {/* Vehicles currently in this stage */}
              <div className="mt-3 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] text-slate-500 mb-1">Active In Stage ({currentInStage.length}):</div>
                {currentInStage.length > 0 ? (
                  <div className="space-y-1">
                    {currentInStage.map(ci => (
                      <div
                        key={ci.instructionId}
                        className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono text-[10px] truncate"
                      >
                        {ci.vehicleReg}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono italic">Idle Stage</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Metrics & Injection Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Pipeline Gantt / Matrix Chart (Cycles vs Instructions) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Pipeline Space-Time Matrix</h3>
              <p className="text-xs text-slate-400">Clock Cycle ($T$) vs Instruction / Vehicle Sequence</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">Current Cycle:</span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                Cycle #{clockCycle}
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 font-mono text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3 text-left">Vehicle / Inst</th>
                  {cycleHeaders.map(c => (
                    <th
                      key={c}
                      className={`py-2 px-2 min-w-[42px] ${c === clockCycle ? 'bg-cyan-950/60 text-cyan-300 font-bold border-b-2 border-cyan-500' : ''}`}
                    >
                      C{c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {instructions.map(inst => (
                  <tr key={inst.instructionId} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-left font-bold text-white flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">{inst.instructionId}</span>
                      <span className="text-indigo-300">{inst.vehicleReg}</span>
                    </td>
                    {cycleHeaders.map((c, cIdx) => {
                      const stage = inst.history[cIdx] || '-';
                      const isStall = stage === 'STALL';
                      const isRetired = stage === '-';

                      return (
                        <td key={c} className="py-2 px-1">
                          {isStall ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                              STALL
                            </span>
                          ) : isRetired ? (
                            <span className="text-slate-700 text-[10px]">&bull;</span>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              stage === 'VR'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : stage === 'SAC'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : stage === 'PSA'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : stage === 'TG'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {stage}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> VR: Registration
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> SAC: Slot Check
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> PSA: Allocation (Lock)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-500"></span> TG: Ticket Token
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> DS: DB Storage
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded bg-rose-600"></span> STALL: Hazard
            </span>
          </div>
        </div>

        {/* Right Col: Mathematical Performance & Inject Vehicle */}
        <div className="space-y-6">
          
          {/* Mathematical Formulas Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Pipeline Theoretical Speedup</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px]">Sequential (Non-Pipelined) Cycles:</div>
                <div className="text-white font-bold">T_seq = n &times; k = {n} &times; 5 = {nonPipelinedCycles} cycles</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px]">Ideal Pipelined Cycles:</div>
                <div className="text-white font-bold">T_ideal = k + (n - 1) = 5 + {n - 1} = {idealPipelinedCycles} cycles</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px]">Actual Speedup Achieved:</div>
                <div className="text-cyan-400 text-lg font-bold">
                  S_k = T_seq / T_actual = {actualSpeedup}x
                </div>
                <div className="text-[10px] text-slate-500">Max theoretical: {idealSpeedup}x (k = 5)</div>
              </div>

              <div className="flex justify-between items-center text-slate-300 pt-1">
                <span>Structural Stalls:</span>
                <span className="text-rose-400 font-bold">{stalls} cycles</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Throughput (IPC):</span>
                <span className="text-emerald-400 font-bold">{throughputIPC} inst/cycle</span>
              </div>
            </div>
          </div>

          {/* Inject Vehicle Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Inject Vehicle to Pipeline</h3>
            <form onSubmit={handleInjectVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Vehicle Plate</label>
                <input
                  type="text"
                  placeholder="e.g. WB-02-ZZ-9999"
                  value={newReg}
                  onChange={e => setNewReg(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Vehicle Category</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Car">Car</option>
                  <option value="SUV">SUV</option>
                  <option value="Bike">Bike</option>
                  <option value="EV">EV</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Push Into Stage 1 (VR)</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
