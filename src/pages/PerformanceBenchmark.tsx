import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Play,
  TrendingUp,
  BarChart3,
  Layers,
  Cpu,
  Clock,
  Zap,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { capEngine } from '../services/capEngine';
import { BenchmarkResult } from '../types';

export const PerformanceBenchmark: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>(capEngine.getRecentBenchmarks());
  const [selectedBatch, setSelectedBatch] = useState<number>(100);
  const [isRunning, setIsRunning] = useState(false);
  const [latestResult, setLatestResult] = useState<BenchmarkResult | null>(benchmarks[0] || null);

  const refresh = () => {
    setBenchmarks(capEngine.getRecentBenchmarks());
  };

  useEffect(() => {
    refresh();
    const unsub = capEngine.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleRunBenchmark = async (count: number) => {
    setSelectedBatch(count);
    setIsRunning(true);

    // Pulse processors
    capEngine.recordProcessorActivity('CPU-1', 'ENTRY_REGISTER', `Benchmark Load: Ingesting ${count} vehicles`, 300);
    capEngine.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', `Benchmark Load: Allocating ${count} slots`, 400);

    const result = await capEngine.runBenchmark(count);
    setLatestResult(result);
    setIsRunning(false);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }
  };

  // Seed sample benchmarks if empty
  useEffect(() => {
    if (benchmarks.length === 0) {
      capEngine.runBenchmark(10).then(() => {
        capEngine.runBenchmark(50).then(() => {
          capEngine.runBenchmark(100);
        });
      });
    }
  }, []);

  // Amdahl's Law calculations
  // Assume parallel portion P = 0.85 (85% of parking tasks are parallelizable)
  const P = 0.85;
  const N = 4; // 4 cores
  const amdahlMaxSpeedup = Math.round((1 / ((1 - P) + (P / N))) * 100) / 100; // ~2.76x with 4 cores

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                CAP PERFORMANCE & SPEEDUP BENCHMARK
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                Amdahl's Law Validation
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Multiprocessor Performance & Speedup Evaluation</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Benchmarks sequential vs parallel processing across batches of 10, 50, 100, and 500 vehicles. Calculates real speedup S = T_seq / T_par and core utilization.
            </p>
          </div>
        </div>
      </div>

      {/* Batch Selector & Trigger Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Select Arrival Batch Size</h3>
            <p className="text-xs text-slate-400">Simulate concurrent vehicle arrivals at the parking gates.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[10, 50, 100, 500].map(count => (
              <button
                key={count}
                disabled={isRunning}
                onClick={() => handleRunBenchmark(count)}
                className={`px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedBatch === count && !isRunning
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20 ring-2 ring-cyan-500/30'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{count} Vehicles</span>
              </button>
            ))}
          </div>
        </div>

        {isRunning && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-mono text-cyan-400">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                Benchmarking {selectedBatch} Vehicles across 4 Multiprocessors...
              </span>
              <span>Running</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}
      </div>

      {/* Latest Benchmark KPI Highlights */}
      {latestResult && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Speedup */}
          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/60 shadow-lg font-mono">
            <div className="text-[10px] text-cyan-400 uppercase font-bold">Speedup ($S$)</div>
            <div className="text-3xl font-extrabold text-cyan-300 mt-1">
              {latestResult.speedup}x
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              T_seq / T_par
            </div>
          </div>

          {/* Sequential Time */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg font-mono">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Sequential Time (T_seq)</div>
            <div className="text-2xl font-bold text-slate-200 mt-1">
              {latestResult.sequentialTimeMs} ms
            </div>
            <div className="text-[10px] text-slate-500 mt-1">1 Core Serial</div>
          </div>

          {/* Parallel Time */}
          <div className="p-4 rounded-xl bg-slate-900 border border-emerald-800/60 shadow-lg font-mono">
            <div className="text-[10px] text-emerald-400 uppercase font-bold">Parallel Time (T_par)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {latestResult.parallelTimeMs} ms
            </div>
            <div className="text-[10px] text-slate-500 mt-1">4 Cores Multithreaded</div>
          </div>

          {/* Throughput */}
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-800/60 shadow-lg font-mono">
            <div className="text-[10px] text-indigo-400 uppercase font-bold">Throughput</div>
            <div className="text-2xl font-bold text-indigo-300 mt-1">
              {latestResult.throughputPerSec} /s
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Vehicles processed / sec</div>
          </div>

          {/* Core Efficiency */}
          <div className="col-span-2 md:col-span-1 p-4 rounded-xl bg-slate-900 border border-purple-800/60 shadow-lg font-mono">
            <div className="text-[10px] text-purple-400 uppercase font-bold">Multicore Efficiency</div>
            <div className="text-2xl font-bold text-purple-300 mt-1">
              {latestResult.efficiency}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">S / 4 Cores</div>
          </div>

        </div>
      )}

      {/* Visual Bar Comparison & Amdahl's Law Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Benchmark Results Table & Time Visualizer */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Benchmark Execution History</h3>
              <p className="text-xs text-slate-400">Sequential vs Parallel Time Comparison (T_seq vs T_par)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Vehicles</th>
                  <th className="py-3 px-4">Sequential</th>
                  <th className="py-3 px-4">Parallel (4 Cores)</th>
                  <th className="py-3 px-4">Speedup</th>
                  <th className="py-3 px-4">Efficiency</th>
                  <th className="py-3 px-4">Throughput</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {benchmarks.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{b.vehicleCount} cars</td>
                    <td className="py-3 px-4 text-slate-400">{b.sequentialTimeMs} ms</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{b.parallelTimeMs} ms</td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">{b.speedup}x</td>
                    <td className="py-3 px-4 text-purple-300">{b.efficiency}%</td>
                    <td className="py-3 px-4 text-indigo-300">{b.throughputPerSec} req/s</td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]">{b.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual Execution Time Bar Graph */}
          {latestResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="font-bold text-white flex justify-between">
                <span>Execution Latency for {latestResult.vehicleCount} Vehicles</span>
                <span className="text-cyan-400">{latestResult.speedup}x Faster</span>
              </div>

              {/* Sequential Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Sequential 1-Core Execution (T_seq):</span>
                  <span>{latestResult.sequentialTimeMs} ms</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div className="bg-rose-500 h-3 rounded-full w-full" />
                </div>
              </div>

              {/* Parallel Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Parallel 4-Core Execution (T_par):</span>
                  <span className="text-emerald-400 font-bold">{latestResult.parallelTimeMs} ms</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(10, (latestResult.parallelTimeMs / (latestResult.sequentialTimeMs || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Amdahl's Law & Core Utilization Breakdown */}
        <div className="space-y-6">
          
          {/* Amdahl's Law Theory */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 font-mono text-xs">
            <h3 className="font-bold text-white text-base">Amdahl's Law Model</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Calculates theoretical maximum speedup given parallel fraction P and N cores:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-bold text-cyan-400 text-sm">
              S(N) = 1 / ((1 - P) + (P / N))
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Parallel Fraction (P):</span>
                <span>85% (0.85)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serial Fraction ($1 - P$):</span>
                <span>15% (0.15)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Processors ($N$):</span>
                <span>4 Cores</span>
              </div>
              <div className="flex justify-between font-bold text-indigo-300 pt-1 border-t border-slate-800">
                <span>Theoretical Limit:</span>
                <span>{amdahlMaxSpeedup}x Max Speedup</span>
              </div>
            </div>
          </div>

          {/* Core Load Distribution for Latest Batch */}
          {latestResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 font-mono text-xs">
              <h3 className="font-bold text-white text-base">Core Load Distribution</h3>
              <p className="text-slate-400 text-[11px]">Workload balance across 4 processors during batch run:</p>
              
              <div className="space-y-2.5">
                {latestResult.coreUtilization.map((util, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-cyan-300 font-bold">CPU-{i + 1}</span>
                      <span className="text-slate-300">{util}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full"
                        style={{ width: `${util}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
