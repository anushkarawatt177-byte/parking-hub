import React, { useState } from 'react';
import {
  LogIn,
  Car,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Printer,
  Sparkles,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';
import { VehicleType, ParkingZone, ParkingTicket } from '../types';

export const VehicleEntry: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [regNumber, setRegNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [preferredZone, setPreferredZone] = useState<ParkingZone | 'AUTO'>('AUTO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [issuedTicket, setIssuedTicket] = useState<ParkingTicket | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);

  // Generate random plate
  const handleRandomPlate = () => {
    const states = ['DL', 'MH', 'KA', 'TN', 'UP', 'TS', 'GJ', 'HR'];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const state = states[Math.floor(Math.random() * states.length)];
    const dist = Math.floor(1 + Math.random() * 20).toString().padStart(2, '0');
    const char1 = letters[Math.floor(Math.random() * letters.length)];
    const char2 = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setRegNumber(`${state}-${dist}-${char1}${char2}-${num}`);
    setResultMessage(null);
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber.trim()) {
      setResultMessage({ type: 'error', text: 'Please enter a valid vehicle registration number.' });
      return;
    }

    const cleanReg = regNumber.trim().toUpperCase();

    // Check duplicate
    if (parkingStore.isVehicleAlreadyParked(cleanReg)) {
      setResultMessage({
        type: 'error',
        text: `Validation Error: Vehicle ${cleanReg} is already parked in the facility! Duplicate entry rejected by Processor 1.`
      });
      return;
    }

    setIsProcessing(true);
    setResultMessage(null);
    setPipelineProgress(10);

    // Stage 1: CPU-1 Vehicle Entry Processor
    capEngine.recordProcessorActivity('CPU-1', 'ENTRY_REGISTER', `Gate 1 Ingestion: Validating ${cleanReg}`, 350, cleanReg);
    await new Promise(r => setTimeout(r, 200));
    setPipelineProgress(40);

    // Stage 2 & 3: CPU-2 Parking Allocation Processor (Mutex Locked Critical Section)
    capEngine.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', `Mutex Lock Critical Section: Allocating slot for ${cleanReg}`, 450, cleanReg);
    await new Promise(r => setTimeout(r, 250));
    setPipelineProgress(75);

    // Perform real allocation
    const targetZone = preferredZone === 'AUTO' ? undefined : preferredZone;
    const allocationResult = parkingStore.allocateSlot(cleanReg, vehicleType, targetZone);

    if (!allocationResult.success || !allocationResult.ticket) {
      setIsProcessing(false);
      setPipelineProgress(0);
      setResultMessage({
        type: 'error',
        text: allocationResult.message
      });
      return;
    }

    // Stage 4: CPU-4 Ticket Generation & Database Storage
    capEngine.recordProcessorActivity('CPU-4', 'BILLING_CALCULATE', `Ticket Cryptographic Token: ${allocationResult.ticket.ticketId}`, 200);
    capEngine.accessSlotCache(allocationResult.ticket.slotId, true);
    capEngine.updateCacheLine(allocationResult.ticket.slotId, 'Occupied', cleanReg);

    setPipelineProgress(100);
    await new Promise(r => setTimeout(r, 150));

    setIsProcessing(false);
    setIssuedTicket(allocationResult.ticket);
    setResultMessage({
      type: 'success',
      text: allocationResult.message
    });

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // safe fallback
    }
  };

  const printTicket = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              GATE 1 INGRESS &bull; CPU-1 & CPU-2
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Vehicle Entry & Automated Slot Allocation</h1>
          <p className="text-sm text-slate-400">
            Concurrently ingests vehicle signals, checks availability via cache, and allocates slots with thread-safe Mutex locks.
          </p>
        </div>

        <button
          onClick={handleRandomPlate}
          type="button"
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto-Generate Sample Plate</span>
        </button>
      </div>

      {/* Main Entry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleEntrySubmit} className="space-y-6">
            
            {/* Registration Number Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Vehicle Registration Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. DL-01-AB-1234 or KA-05-MN-9988"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-white font-mono text-lg font-bold placeholder:text-slate-600 focus:outline-hidden transition-all uppercase"
                />
                <div className="absolute right-3 top-3.5">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Plate Recognizer
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Processor 1 enforces duplicate entry rejection on active sessions.
              </p>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Vehicle Category <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'Car', label: 'Car / Sedan', desc: '$5/hr base', icon: Car, zone: 'Zone A' },
                  { type: 'SUV', label: 'SUV / 4x4', desc: '$8/hr base', icon: Car, zone: 'Zone B' },
                  { type: 'Bike', label: 'Motorbike', desc: '$2/hr base', icon: Car, zone: 'Zone C' },
                  { type: 'EV', label: 'Electric EV', desc: '$6/hr base', icon: Zap, zone: 'Zone D' },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = vehicleType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setVehicleType(item.type as VehicleType)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="text-[10px] font-mono text-slate-500">{item.zone}</span>
                      </div>
                      <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {item.type}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zone Preference */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Zone Allocation Strategy
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'AUTO', label: 'Auto (Recommended)' },
                  { id: 'A', label: 'Zone A (Car)' },
                  { id: 'B', label: 'Zone B (SUV)' },
                  { id: 'C', label: 'Zone C (Bike)' },
                  { id: 'D', label: 'Zone D (EV)' },
                ].map(z => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setPreferredZone(z.id as any)}
                    className={`py-2 px-3 rounded-lg border font-medium transition-all ${
                      preferredZone === z.id
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Execution Indicator during processing */}
            {isProcessing && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-mono flex items-center gap-2">
                    <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
                    Executing Multiprocessor Pipeline: VR &rarr; SAC &rarr; PSA (Lock) &rarr; TG
                  </span>
                  <span className="font-mono text-slate-400">{pipelineProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${pipelineProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Result Message Banner */}
            {resultMessage && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                resultMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}>
                {resultMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs leading-relaxed font-mono">
                  {resultMessage.text}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Concurrently...' : 'Check Availability & Allocate Slot'}</span>
            </button>

          </form>
        </div>

        {/* Right Col: Live Generated Parking Ticket */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="font-bold text-white text-sm">Issued Parking Ticket</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Print Ready
              </span>
            </div>

            {issuedTicket ? (
              <div id="printable-ticket" className="bg-white text-slate-900 rounded-xl p-5 shadow-lg border border-slate-200 font-mono space-y-4">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-indigo-900">
                    AutoPark CAP Smart Parking
                  </div>
                  <div className="text-[10px] text-slate-500">Autonomous Multiprocessor Gate 1</div>
                  <div className="text-lg font-black tracking-tight text-slate-950 mt-1">
                    {issuedTicket.ticketId}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Reg:</span>
                    <span className="font-bold text-slate-950">{issuedTicket.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Type:</span>
                    <span className="font-semibold">{issuedTicket.vehicleType}</span>
                  </div>
                  <div className="flex justify-between text-indigo-700 font-bold">
                    <span>Assigned Slot:</span>
                    <span className="text-base px-2 py-0.5 rounded bg-indigo-100">{issuedTicket.slotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parking Zone:</span>
                    <span className="font-semibold">Zone {issuedTicket.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entry Time:</span>
                    <span className="font-medium text-[11px]">{new Date(issuedTicket.entryTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Initial Rate:</span>
                    <span className="font-semibold">${issuedTicket.ratePerHour}.00/hr</span>
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="pt-2 border-t border-dashed border-slate-300 text-center">
                  <div className="font-mono text-xl tracking-widest text-slate-800 font-black">
                    ||||| ||| |||| || |||||
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    * {issuedTicket.ticketId} *
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 text-center leading-tight">
                  Please retain this ticket. Present at Gate 2 for automatic checkout & fee computation.
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-6 flex flex-col items-center justify-center text-slate-500">
                <QrCode className="w-12 h-12 text-slate-700 mb-2 stroke-1" />
                <p className="text-xs font-medium text-slate-400">No ticket generated yet</p>
                <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
                  Fill vehicle details or click "Auto-Generate Sample Plate" to allocate a slot.
                </p>
              </div>
            )}
          </div>

          {issuedTicket && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={printTicket}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ticket</span>
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Dashboard
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
