import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Car,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  FileText,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';
import { ParkingSession, VehicleType } from '../types';

export const Reports: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<ParkingSession[]>(parkingStore.getSessions());
  const [reportRange, setReportRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  const refresh = () => {
    setSessions(parkingStore.getSessions());
  };

  useEffect(() => {
    refresh();
    const unsub = parkingStore.subscribe(refresh);
    return () => unsub();
  }, []);

  const totalRevenue = sessions.reduce((sum, s) => sum + s.totalFee, 0);
  const totalVehicles = sessions.length;
  const avgDuration = totalVehicles > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / totalVehicles) : 0;

  // Breakdown by vehicle type
  const typeRevenue = {
    Car: sessions.filter(s => s.vehicleType === 'Car').reduce((sum, s) => sum + s.totalFee, 0),
    SUV: sessions.filter(s => s.vehicleType === 'SUV').reduce((sum, s) => sum + s.totalFee, 0),
    Bike: sessions.filter(s => s.vehicleType === 'Bike').reduce((sum, s) => sum + s.totalFee, 0),
    EV: sessions.filter(s => s.vehicleType === 'EV').reduce((sum, s) => sum + s.totalFee, 0),
  };

  const typeCounts = {
    Car: sessions.filter(s => s.vehicleType === 'Car').length,
    SUV: sessions.filter(s => s.vehicleType === 'SUV').length,
    Bike: sessions.filter(s => s.vehicleType === 'Bike').length,
    EV: sessions.filter(s => s.vehicleType === 'EV').length,
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['SessionID', 'TicketID', 'VehicleReg', 'Type', 'SlotID', 'EntryTime', 'ExitTime', 'DurationMinutes', 'TotalFee', 'PaymentMethod', 'Status'];
    const rows = sessions.map(s => [
      s.sessionId,
      s.ticketId,
      s.registrationNumber,
      s.vehicleType,
      s.slotId,
      s.entryTime,
      s.exitTime,
      s.durationMinutes,
      s.totalFee,
      s.paymentMethod,
      s.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `parking_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Exporter
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `parking_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              EXECUTIVE ANALYTICS & REVENUE AUDIT
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Parking Analytics & Financial Reports</h1>
          <p className="text-sm text-slate-400">
            Daily throughput, average dwell times, revenue breakdowns, and exportable financial datasets.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Completed Sessions</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{totalVehicles}</div>
          <div className="text-[11px] text-slate-500 mt-1">Processed by CPU-3</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-900/50 shadow-xl font-mono bg-indigo-950/20">
          <div className="flex justify-between items-center text-xs text-indigo-400">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-indigo-300 mt-2">${totalRevenue.toFixed(2)}</div>
          <div className="text-[11px] text-indigo-400/80 mt-1">Auto-calculated by CPU-4</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Avg Dwell Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-2">{avgDuration} min</div>
          <div className="text-[11px] text-slate-500 mt-1">~{(avgDuration / 60).toFixed(1)} hours/vehicle</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Avg Fee / Vehicle</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">
            ${totalVehicles > 0 ? (totalRevenue / totalVehicles).toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tariff yield</div>
        </div>

      </div>

      {/* Breakdown by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Revenue Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base">Revenue by Vehicle Category</h3>
          <div className="space-y-3">
            {[
              { type: 'Car', label: 'Cars / Sedans', revenue: typeRevenue.Car, count: typeCounts.Car, color: 'from-blue-500 to-cyan-500' },
              { type: 'SUV', label: 'SUVs & 4x4s', revenue: typeRevenue.SUV, count: typeCounts.SUV, color: 'from-indigo-500 to-purple-500' },
              { type: 'Bike', label: 'Motorbikes & Scooters', revenue: typeRevenue.Bike, count: typeCounts.Bike, color: 'from-emerald-500 to-teal-500' },
              { type: 'EV', label: 'Electric Vehicles (EV)', revenue: typeRevenue.EV, count: typeCounts.EV, color: 'from-amber-500 to-orange-500' },
            ].map(item => {
              const pct = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 25;
              return (
                <div key={item.type} className="space-y-1 font-mono">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-medium">{item.label} ({item.count} stays)</span>
                    <span className="text-emerald-400 font-bold">${item.revenue.toFixed(2)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours Traffic Estimation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 font-mono">
          <h3 className="font-bold text-white text-base">Estimated Hourly Traffic Volume</h3>
          <p className="text-xs text-slate-400">Distribution of vehicle arrivals across typical facility operational hours:</p>

          <div className="grid grid-cols-6 gap-2 text-center text-xs pt-2">
            {[
              { hour: '08:00', vol: 35, peak: false },
              { hour: '10:00', vol: 88, peak: true },
              { hour: '12:00', vol: 64, peak: false },
              { hour: '14:00', vol: 52, peak: false },
              { hour: '17:00', vol: 96, peak: true },
              { hour: '19:00', vol: 48, peak: false },
            ].map(h => (
              <div key={h.hour} className="flex flex-col items-center gap-1">
                <div className="h-28 w-full bg-slate-950 rounded-lg flex items-end justify-center p-1 border border-slate-800">
                  <div
                    className={`w-full rounded transition-all ${h.peak ? 'bg-indigo-500 shadow-md shadow-indigo-500/30' : 'bg-slate-700'}`}
                    style={{ height: `${h.vol}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{h.hour}</span>
                <span className="text-[10px] text-cyan-400 font-bold">{h.vol}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Complete Historical Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">Audit Trail of Completed Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Entry</th>
                <th className="py-3 px-4">Exit</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Fee ($)</th>
                <th className="py-3 px-4">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {sessions.map(s => (
                <tr key={s.sessionId} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-400">{s.sessionId}</td>
                  <td className="py-3 px-4 text-cyan-400 font-bold">{s.ticketId}</td>
                  <td className="py-3 px-4 text-white font-semibold">{s.registrationNumber}</td>
                  <td className="py-3 px-4">{s.slotId}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(s.entryTime).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(s.exitTime).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 font-bold">{s.durationMinutes}m</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">${s.totalFee.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-400">{s.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
