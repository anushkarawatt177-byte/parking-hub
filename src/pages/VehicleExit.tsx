import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Search,
  Car,
  Clock,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Printer,
  CreditCard,
  Smartphone,
  Banknote,
  Cpu,
  RefreshCw,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';
import { ParkingSlot, ParkingSession, ParkingTicket } from '../types';

export const VehicleExit: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [searchKey, setSearchKey] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI/Fastag' | 'Wallet'>('UPI/Fastag');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptSession, setReceiptSession] = useState<ParkingSession | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active parked slots for quick selection
  const [activeSlots, setActiveSlots] = useState<ParkingSlot[]>([]);

  const refreshActive = () => {
    setActiveSlots(parkingStore.getSlots().filter(s => s.status === 'Occupied'));
  };

  useEffect(() => {
    refreshActive();
    const unsub1 = parkingStore.subscribe(refreshActive);
    const unsub2 = capEngine.subscribe(refreshActive);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleQuickSelect = (slot: ParkingSlot) => {
    if (slot.allocatedVehicleReg) {
      setSearchKey(slot.allocatedVehicleReg);
      setStatusMessage(null);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a Vehicle Registration Number or Ticket ID.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    // CPU-3: Vehicle Exit Processor
    capEngine.recordProcessorActivity(
      'CPU-3',
      'EXIT_PROCESS',
      `Gate 2 Egress: Reading session & duration for ${searchKey}`,
      350
    );
    await new Promise(r => setTimeout(r, 200));

    // CPU-4: Billing & Reporting Processor
    capEngine.recordProcessorActivity(
      'CPU-4',
      'BILLING_CALCULATE',
      `Tariff computation & tax invoice for ${searchKey}`,
      300
    );
    await new Promise(r => setTimeout(r, 200));

    const result = parkingStore.releaseSlot(searchKey, paymentMethod);

    if (!result.success || !result.session) {
      setIsProcessing(false);
      setStatusMessage({ type: 'error', text: result.message });
      return;
    }

    // Invalidate Cache and write-through to DB
    capEngine.invalidateCacheLine(result.session.slotId);
    capEngine.accessSlotCache(result.session.slotId, true);
    capEngine.updateCacheLine(result.session.slotId, 'Available', undefined);

    setIsProcessing(false);
    setReceiptSession(result.session);
    setStatusMessage({ type: 'success', text: result.message });
    setSearchKey('');

    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              GATE 2 EGRESS &bull; CPU-3 & CPU-4
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Vehicle Exit, Fee Calculation & Slot Release</h1>
          <p className="text-sm text-slate-400">
            Searches active sessions, computes duration and vehicle tariffs, releases slot back to Available, and broadcasts cache invalidation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Search & Checkout Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <form onSubmit={handleCheckout} className="space-y-6">
              
              {/* Search Key Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Search Vehicle Registration or Ticket ID <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. DL-01-CA-2001, TCK-1001, or Slot ID A-101"
                    value={searchKey}
                    onChange={e => setSearchKey(e.target.value.toUpperCase())}
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3.5 text-white font-mono text-lg font-bold placeholder:text-slate-600 focus:outline-hidden uppercase"
                  />
                  <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-4" />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Payment Collection Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'UPI/Fastag', label: 'UPI / Fastag', icon: Smartphone },
                    { id: 'Card', label: 'Credit/Debit Card', icon: CreditCard },
                    { id: 'Cash', label: 'Cash Gate', icon: Banknote },
                    { id: 'Wallet', label: 'Digital Wallet', icon: Zap },
                  ].map(method => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 text-white ring-2 ring-indigo-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-semibold">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs font-mono leading-relaxed">
                    {statusMessage.text}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{isProcessing ? 'Calculating & Deallocating...' : 'Process Exit & Generate Receipt'}</span>
              </button>

            </form>
          </div>

          {/* Quick Select from Active Parked Vehicles */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Currently Parked Vehicles ({activeSlots.length} Active)
              </span>
              <span className="text-[11px] text-slate-500">Click any plate for quick checkout</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {activeSlots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => handleQuickSelect(slot)}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/70 text-left transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {slot.allocatedVehicleReg}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {slot.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{slot.type}</span>
                    <span>{slot.entryTime ? new Date(slot.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Printable Receipt */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="font-bold text-white text-sm">Official Parking Receipt</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Paid In Full
              </span>
            </div>

            {receiptSession ? (
              <div id="printable-receipt" className="bg-white text-slate-900 rounded-xl p-5 shadow-lg border border-slate-200 font-mono space-y-4">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-indigo-900">
                    AutoPark CAP Tax Invoice
                  </div>
                  <div className="text-[10px] text-slate-500">Autonomous Gate 2 Checkout</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    Session: {receiptSession.sessionId}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Reg:</span>
                    <span className="font-bold text-slate-950">{receiptSession.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold">{receiptSession.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Slot Released:</span>
                    <span className="font-semibold">{receiptSession.slotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entry Time:</span>
                    <span className="font-medium text-[11px]">{new Date(receiptSession.entryTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exit Time:</span>
                    <span className="font-medium text-[11px]">{new Date(receiptSession.exitTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-950">{receiptSession.durationMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Via:</span>
                    <span className="font-semibold">{receiptSession.paymentMethod}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-indigo-950">
                    <span>Total Paid:</span>
                    <span className="text-base text-emerald-700 font-mono">${receiptSession.totalFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-500 text-center space-y-0.5">
                  <div>CPU-3 (Exit Processor) &bull; CPU-4 (Billing Processor)</div>
                  <div>Cache Line Invalidated & Slot Restored to Available.</div>
                  <div className="font-bold text-slate-800">Thank you for visiting! Drive safe.</div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-6 flex flex-col items-center justify-center text-slate-500">
                <Receipt className="w-12 h-12 text-slate-700 mb-2 stroke-1" />
                <p className="text-xs font-medium text-slate-400">No checkout session selected</p>
                <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
                  Search an active vehicle plate or choose from currently parked vehicles list.
                </p>
              </div>
            )}
          </div>

          {receiptSession && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
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
