import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  HardDrive,
  Lock,
  Zap,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const CapDocs: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: '1. What computer architecture model does this Smart Parking system implement?',
      a: 'The system implements an MIMD (Multiple Instruction, Multiple Data) Multiprocessor Architecture. It simulates 4 dedicated processor cores (CPU-1 for Entry/Validation, CPU-2 for Slot Allocation/Locking, CPU-3 for Checkout/Deallocation, CPU-4 for Billing/Invoicing) operating asynchronously on shared and distributed memory structures.'
    },
    {
      q: '2. How is Instruction Pipelining applied to smart parking requests?',
      a: 'The vehicle entry lifecycle is partitioned into a 5-stage synchronous pipeline: 1. Vehicle Registration (VR), 2. Slot Availability Check (SAC), 3. Parking Slot Allocation (PSA), 4. Ticket Generation (TG), and 5. Database Storage (DS). Each clock cycle, instructions advance through independent hardware units, achieving a theoretical throughput of 1 vehicle per cycle.'
    },
    {
      q: '3. What hazards can occur in this parking pipeline, and how are they handled?',
      a: 'The primary hazard is a Structural Hazard on Stage 3 (PSA), which requires exclusive hardware Mutex lock acquisition on the slot allocation memory table. If multiple concurrent vehicles reach PSA simultaneously, hardware lock contention causes pipeline stall bubbles (STALL), serializing the critical section.'
    },
    {
      q: '4. How does the MESI Cache Coherence protocol ensure consistency?',
      a: 'When CPU-2 modifies a parking slot status from Available to Occupied, its local cache line transitions from Shared (S) to Modified (M). A Bus Invalidate (BusRdX) broadcast is snooped by all other cores, transitioning their cached copies to Invalid (I) state. This prevents CPU-1 or CPU-3 from reading stale slot data.'
    },
    {
      q: '5. What is the AMAT formula and how does cache memory optimize parking lookup?',
      a: 'Average Memory Access Time is defined as AMAT = T_hit + (Miss_Rate * Miss_Penalty). By caching frequently queried slot states in on-chip SRAM (1ns), the system achieves >92% hit ratios, reducing average access latency from 100ns (RAM) down to <9ns.'
    },
    {
      q: '6. What is a Race Condition in parking allocation and how is it prevented?',
      a: 'A Race Condition occurs when two threads simultaneously check an available slot before either writes, resulting in both threads assigning the SAME slot to different vehicles (Double-Booking Bug). We demonstrate this flaw in our Sync Lab, and prove how Mutex locks or hardware Compare-And-Swap (CAS) completely eliminate collisions.'
    },
    {
      q: '7. How does Amdahl’s Law limit parallel speedup in this system?',
      a: 'Amdahl’s Law states Speedup S(N) = 1 / ((1 - P) + (P / N)). Even with infinite processor cores, speedup is strictly capped by the serial fraction (1 - P). Because critical sections like Mutex slot allocation represent approximately 15% serial overhead, the theoretical maximum speedup on 4 cores is ~2.76x.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
            TECHNICAL GUIDE & VIVA PREPARATION
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Computer Architecture & Parallel Processing (CAP) Reference</h1>
        <p className="text-sm text-slate-400 mt-1">
          Comprehensive project manual, theoretical formulas, CPU architecture diagrams, and academic viva oral defense questions.
        </p>
      </div>

      {/* 5 Core Concept Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Concept 1 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>1. CPU Architecture & Registers</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every simulated core contains classical von Neumann registers: <strong>PC</strong> (Program Counter: holds next instruction memory address), <strong>IR</strong> (Instruction Register: holds current opcode), <strong>MAR</strong> (Memory Address Register), and <strong>MDR</strong> (Memory Data Register).
          </p>
        </div>

        {/* Concept 2 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>2. Multiprocessor Architecture (MIMD)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Utilizes 4 symmetric multiprocessing cores with an ExecutorService threadpool. Tasks are balanced across CPU-1 (Entry), CPU-2 (Allocation Lock), CPU-3 (Checkout), and CPU-4 (Billing).
          </p>
        </div>

        {/* Concept 3 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>3. 5-Stage Instruction Pipelining</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Breaks vehicle entry into 5 discrete stages: <strong>VR &rarr; SAC &rarr; PSA &rarr; TG &rarr; DS</strong>. Overlapping execution achieves spatial parallelism with throughput approaching 1 instruction per cycle (IPC).
          </p>
        </div>

        {/* Concept 4 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <HardDrive className="w-4 h-4" />
            <span>4. Memory Hierarchy & MESI Coherence</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Demonstrates L1 SRAM (1ns), L2 shared (10ns), RAM (100ns), and MySQL Disk (10ms). The 4-state <strong>MESI</strong> protocol (Modified, Exclusive, Shared, Invalid) prevents stale slot data via snooping.
          </p>
        </div>

      </div>

      {/* College Viva Questions Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-white text-base">Viva Voce / Oral Defense Questions & Answers</h3>
            <p className="text-xs text-slate-400">Standard evaluation questions asked by external university examiners.</p>
          </div>
        </div>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-semibold text-xs text-white flex justify-between items-center gap-3 cursor-pointer hover:bg-slate-900/60"
                >
                  <span className="text-indigo-300">{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 text-xs text-slate-300 font-mono leading-relaxed border-t border-slate-800/60 bg-slate-900/40">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
