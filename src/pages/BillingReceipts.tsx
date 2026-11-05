import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  Printer,
  Calendar,
  CheckCircle2,
  Car,
  CreditCard,
  Smartphone,
  Banknote,
  Zap,
  ArrowRight
} from 'lucide-react';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';
import { ParkingSession, ParkingTicket } from '../types';

export const BillingReceipts: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<ParkingSession[]>(parkingStore.getSessions());
  const [tickets, setTickets] = useState<ParkingTicket[]>(parkingStore.getTickets());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<ParkingSession | null>(null);

  const refresh = () => {
    setSessions(parkingStore.getSessions());
    setTickets(parkingStore.getTickets());
  };

  useEffect(() => {
    refresh();
    const unsub = parkingStore.subscribe(refresh);
    return () => unsub();
  }, []);

  const totalRevenue = sessions.reduce((sum, s) => sum + s.totalFee, 0);

  const filteredSessions = sessions.filter(s => {
    const matchesSearch =
      s.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slotId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = filterMethod === 'ALL' || s.paymentMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              CPU-4 &bull; BILLING & REPORTING ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Billing, Invoices & Payment Receipts</h1>
          <p className="text-sm text-slate-400">
            Real-time collection logs, transaction hashes, and printable official parking receipts.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-indigo-900/60 flex items-center gap-4">
          <div>
            <div className="text-[11px] text-slate-400 font-mono">Total Collected Revenue</div>
            <div className="text-xl font-bold text-indigo-300 font-mono">${totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search ticket, plate, or slot..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Payment Method:</span>
          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="ALL">All Methods</option>
            <option value="UPI/Fastag">UPI / Fastag</option>
            <option value="Card">Credit/Debit Card</option>
            <option value="Cash">Cash</option>
            <option value="Wallet">Digital Wallet</option>
          </select>
        </div>
      </div>

      {/* Main Sessions Table & Printable Receipt Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sessions Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Fee ($)</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredSessions.map(s => (
                  <tr
                    key={s.sessionId}
                    onClick={() => setSelectedSession(s)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-cyan-400 font-bold">{s.ticketId}</td>
                    <td className="py-3 px-4 text-white font-semibold">{s.registrationNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {s.vehicleType}
                      </span>
                    </td>
                    <td className="py-3 px-4">{s.slotId}</td>
                    <td className="py-3 px-4">{s.durationMinutes}m</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">${s.totalFee.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-400">{s.paymentMethod}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(s);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Receipt View */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="font-bold text-white text-sm">Receipt Inspector</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Validated
              </span>
            </div>

            {selectedSession ? (
              <div id="active-receipt" className="bg-white text-slate-900 rounded-xl p-5 shadow-lg border border-slate-200 font-mono space-y-4">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-indigo-900">
                    AutoPark CAP Tax Invoice
                  </div>
                  <div className="text-[10px] text-slate-500">Autonomous Gate 2 Checkout</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {selectedSession.ticketId}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="font-bold text-slate-950">{selectedSession.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Slot:</span>
                    <span className="font-semibold">{selectedSession.slotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entry:</span>
                    <span className="text-[11px]">{new Date(selectedSession.entryTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exit:</span>
                    <span className="text-[11px]">{new Date(selectedSession.exitTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold">{selectedSession.durationMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-semibold">{selectedSession.paymentMethod}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-indigo-950">
                    <span>Total Amount:</span>
                    <span className="text-base text-emerald-700 font-mono">${selectedSession.totalFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-500 text-center">
                  Signed by {selectedSession.processedByBillingProcessor}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-6 flex flex-col items-center justify-center text-slate-500">
                <Receipt className="w-12 h-12 text-slate-700 mb-2 stroke-1" />
                <p className="text-xs font-medium text-slate-400">Select any row from the left</p>
                <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
                  Click on any transaction record to view and print the receipt.
                </p>
              </div>
            )}
          </div>

          {selectedSession && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
