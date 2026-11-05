import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  DollarSign,
  Cpu,
  RotateCcw,
  CheckCircle2,
  Save,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';
import { TariffRule, VehicleType } from '../types';

export const Settings: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [tariffs, setTariffs] = useState<TariffRule[]>(parkingStore.getTariffs());
  const [savedMessage, setSavedMessage] = useState(false);

  const handleRateChange = (
    type: VehicleType,
    field: 'firstHourRate' | 'subsequentHourlyRate' | 'dailyMaxRate',
    value: number
  ) => {
    setTariffs(prev =>
      prev.map(t => (t.vehicleType === type ? { ...t, [field]: value } : t))
    );
  };

  const handleSaveTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    parkingStore.updateTariffs(tariffs);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleResetFactory = () => {
    if (confirm('Reset all parking slots, active sessions, and simulator state back to initial defaults?')) {
      parkingStore.resetToDefault();
      capEngine.resetPipeline();
      setTariffs(parkingStore.getTariffs());
      alert('System successfully restored to default seed state.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              SYSTEM CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Platform Settings & Tariff Rules</h1>
          <p className="text-sm text-slate-400">
            Configure hourly parking fees, grace periods, and simulator factory defaults.
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Tariff configuration saved and synchronized to memory store!</span>
        </div>
      )}

      {/* Tariff Rules Form */}
      <form onSubmit={handleSaveTariffs} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base">Vehicle Tariff Matrix</h3>
            <p className="text-xs text-slate-400">Applied by CPU-4 during checkout computation</p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Tariff Rules</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tariffs.map(t => (
            <div
              key={t.vehicleType}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between font-bold text-sm text-white">
                <span>{t.vehicleType} Tariff</span>
                <span className="text-[10px] text-cyan-400 uppercase">Hourly Billing</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">1st Hour ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={t.firstHourRate}
                    onChange={e => handleRateChange(t.vehicleType, 'firstHourRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Addl/Hr ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={t.subsequentHourlyRate}
                    onChange={e => handleRateChange(t.vehicleType, 'subsequentHourlyRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Day Max ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={t.dailyMaxRate}
                    onChange={e => handleRateChange(t.vehicleType, 'dailyMaxRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </form>

      {/* Danger Zone: Factory Reset */}
      <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-rose-300 text-base">Factory Simulator Reset</h3>
            <p className="text-xs text-slate-400">
              Restore initial 48 slots, default occupied cars, pipeline history, and clear local storage.
            </p>
          </div>

          <button
            onClick={handleResetFactory}
            className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Initial State</span>
          </button>
        </div>
      </div>

    </div>
  );
};
