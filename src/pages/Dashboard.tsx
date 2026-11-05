import React, { useState, useEffect } from 'react';
import {
  Car,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  LogIn,
  LogOut,
  Clock,
  Layers,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';
import { ParkingSlot, ParkingZone, VehicleType } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [sessions, setSessions] = useState(parkingStore.getSessions());
  const [selectedZone, setSelectedZone] = useState<ParkingZone | 'ALL'>('ALL');
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  const refresh = () => {
    setSlots(parkingStore.getSlots());
    setSessions(parkingStore.getSessions());
  };

  useEffect(() => {
    refresh();
    const unsub1 = parkingStore.subscribe(refresh);
    const unsub2 = capEngine.subscribe(refresh);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(s => s.status === 'Occupied').length;
  const availableSlots = slots.filter(s => s.status === 'Available').length;
  const maintenanceSlots = slots.filter(s => s.status === 'Maintenance').length;

  const totalRevenue = sessions.reduce((sum, s) => sum + s.totalFee, 0);
  const enteredToday = slots.filter(s => s.status === 'Occupied').length + sessions.length;
  const exitedToday = sessions.length;

  const filteredSlots = selectedZone === 'ALL'
    ? slots
    : slots.filter(s => s.zone === selectedZone);

  // Group by zone
  const zoneStats = {
    A: { total: slots.filter(s => s.zone === 'A').length, occupied: slots.filter(s => s.zone === 'A' && s.status === 'Occupied').length },
    B: { total: slots.filter(s => s.zone === 'B').length, occupied: slots.filter(s => s.zone === 'B' && s.status === 'Occupied').length },
    C: { total: slots.filter(s => s.zone === 'C').length, occupied: slots.filter(s => s.zone === 'C' && s.status === 'Occupied').length },
    D: { total: slots.filter(s => s.zone === 'D').length, occupied: slots.filter(s => s.zone === 'D' && s.status === 'Occupied').length },
  };

  const processors = capEngine.getProcessors();

  return (
    <div className="space-y-6">
      
      {/* Top Banner / System Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Cpu className="w-80 h-80 text-cyan-400" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                CAP Multiprocessor Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                System Live
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Smart Parking Management Platform
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Parallel concurrent vehicle entry, Mutex-synchronized slot allocation, 5-stage instruction pipelining, and MESI cache-coherent memory hierarchy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('vehicle-entry')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 text-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>New Vehicle Entry</span>
            </button>
            <button
              onClick={() => onNavigate('vehicle-exit')}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 text-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Vehicle Checkout & Fee</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7 Core KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        
        {/* Total Slots */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Slots</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white font-mono">{totalSlots}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">4 Zones (A - D)</div>
          </div>
        </div>

        {/* Available Slots */}
        <div className="bg-slate-900/90 border border-emerald-900/50 rounded-xl p-4 flex flex-col justify-between shadow-xs bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{availableSlots}</div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">
              {Math.round((availableSlots / (totalSlots || 1)) * 100)}% Free
            </div>
          </div>
        </div>

        {/* Occupied Slots */}
        <div className="bg-slate-900/90 border border-rose-900/50 rounded-xl p-4 flex flex-col justify-between shadow-xs bg-rose-950/10">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>Occupied</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-rose-400 font-mono">{occupiedSlots}</div>
            <div className="text-[11px] text-rose-500/80 mt-0.5">
              {Math.round((occupiedSlots / (totalSlots || 1)) * 100)}% Occupancy
            </div>
          </div>
        </div>

        {/* Total Parked */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Parked</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-cyan-400 font-mono">{occupiedSlots}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Live vehicles</div>
          </div>
        </div>

        {/* Entered Today */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Entered Today</span>
            <LogIn className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 font-mono">{enteredToday}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Gate 1 Ingress</div>
          </div>
        </div>

        {/* Exited Today */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Exited Today</span>
            <LogOut className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-400 font-mono">{exitedToday}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Gate 2 Egress</div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="col-span-2 md:col-span-2 lg:col-span-1 bg-slate-900/90 border border-indigo-900/50 rounded-xl p-4 flex flex-col justify-between shadow-xs bg-indigo-950/20">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-medium">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-indigo-300 font-mono">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-indigo-400/80 mt-0.5">Auto-billed</div>
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Real-Time Parking Availability Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Visual Parking Floor Plan */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Parking Availability Map</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Live View
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual slot states: <span className="text-emerald-400 font-semibold">Green (Available)</span>, <span className="text-rose-400 font-semibold">Red (Occupied)</span>. Click slot for operations.
              </p>
            </div>

            {/* Zone Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedZone('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedZone === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Zones
              </button>
              <button
                onClick={() => setSelectedZone('A')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedZone === 'A' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Zone A (Car)
              </button>
              <button
                onClick={() => setSelectedZone('B')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedZone === 'B' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Zone B (SUV)
              </button>
              <button
                onClick={() => setSelectedZone('C')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedZone === 'C' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Zone C (Bike)
              </button>
              <button
                onClick={() => setSelectedZone('D')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedZone === 'D' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Zone D (EV)
              </button>
            </div>
          </div>

          {/* Parking Bay Visualization */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[440px] overflow-y-auto p-1 pr-2">
            {filteredSlots.map(slot => {
              const isOccupied = slot.status === 'Occupied';
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between min-h-[92px] ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 border-transparent shadow-lg scale-102'
                      : isOccupied
                      ? 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-900/40 hover:border-rose-600'
                      : 'bg-emerald-950/20 border-emerald-800/50 hover:bg-emerald-900/30 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                      {slot.id}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500 shadow-sm shadow-rose-500' : 'bg-emerald-400 shadow-sm shadow-emerald-400'}`} />
                  </div>

                  <div className="my-1 flex items-center justify-center">
                    <Car className={`w-6 h-6 transition-transform ${isOccupied ? 'text-rose-400 rotate-0' : 'text-emerald-500/50 opacity-40'}`} />
                  </div>

                  <div className="text-[10px] text-center font-mono truncate">
                    {isOccupied ? (
                      <span className="text-rose-300 font-semibold truncate block">
                        {slot.allocatedVehicleReg}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slot Detail Card if clicked */}
          {selectedSlot && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${selectedSlot.status === 'Occupied' ? 'bg-rose-900/40 text-rose-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-base">Slot {selectedSlot.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                      Zone {selectedSlot.zone} &bull; {selectedSlot.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${selectedSlot.status === 'Occupied' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                      {selectedSlot.status}
                    </span>
                  </div>
                  {selectedSlot.status === 'Occupied' && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Vehicle: <span className="text-white font-bold">{selectedSlot.allocatedVehicleReg}</span> &bull; Parked at: {new Date(selectedSlot.entryTime || '').toLocaleTimeString()}
                    </p>
                  )}
                  {selectedSlot.status === 'Available' && (
                    <p className="text-xs text-slate-400 mt-1">Ready for allocation via Processor 2 (Mutex Safe).</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedSlot.status === 'Occupied' ? (
                  <button
                    onClick={() => onNavigate('vehicle-exit')}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Checkout This Vehicle</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('vehicle-entry')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Allocate Vehicle</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Quad-Core CAP Monitoring Snapshot */}
        <div className="space-y-6">
          
          {/* Quad-Core Processor Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">CAP 4-Core Status</h3>
              </div>
              <button
                onClick={() => onNavigate('cap-processors')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Full Lab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {Object.values(processors).map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{p.id}</span>
                      <span className="text-slate-300 font-medium truncate max-w-[130px]">{p.role}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      p.status === 'Busy'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${p.utilization}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                    <span>Load: {p.utilization}%</span>
                    <span>Done: {p.tasksCompleted}</span>
                    <span>Temp: {p.temperature}°C</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Link to Instruction Pipeline */}
            <div 
              onClick={() => onNavigate('pipeline')}
              className="mt-4 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 hover:border-indigo-600 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-white font-semibold">5-Stage Pipeline</div>
                  <div className="text-[10px] text-slate-400">VR &bull; SAC &bull; PSA &bull; TG &bull; DS</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          {/* Zone Occupancy Progress */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white text-base mb-3">Zone Breakdown</h3>
            <div className="space-y-3">
              {[
                { zone: 'A', label: 'Zone A - Sedans & Hatchbacks', icon: Car, data: zoneStats.A, color: 'from-blue-500 to-cyan-500' },
                { zone: 'B', label: 'Zone B - SUVs & 4x4s', icon: Car, data: zoneStats.B, color: 'from-indigo-500 to-purple-500' },
                { zone: 'C', label: 'Zone C - Motorbikes & Scooters', icon: Car, data: zoneStats.C, color: 'from-emerald-500 to-teal-500' },
                { zone: 'D', label: 'Zone D - Electric Vehicles (EV)', icon: Zap, data: zoneStats.D, color: 'from-amber-500 to-orange-500' },
              ].map(item => {
                const pct = Math.round((item.data.occupied / (item.data.total || 1)) * 100);
                return (
                  <div key={item.zone} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <span className="text-slate-400 font-mono">
                        {item.data.occupied}/{item.data.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${item.color} h-1.5 rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row: Recent Completed Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Recent Completed Parking Sessions</h3>
            <p className="text-xs text-slate-400">Processed by CPU-3 (Checkout) and CPU-4 (Billing)</p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Vehicle Reg</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Fee ($)</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Processor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {sessions.slice(0, 5).map(s => (
                <tr key={s.sessionId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-cyan-400 font-bold">{s.ticketId}</td>
                  <td className="py-3 px-4 text-white font-semibold">{s.registrationNumber}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {s.vehicleType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{s.slotId}</td>
                  <td className="py-3 px-4">{s.durationMinutes} min</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">${s.totalFee.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-400">{s.paymentMethod}</td>
                  <td className="py-3 px-4 text-indigo-300 text-[10px]">{s.processedByBillingProcessor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
