import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { parkingStore } from '../services/parkingStore';
import { capEngine } from '../services/capEngine';
import { ParkingSlot, ParkingZone, SlotStatus, VehicleType } from '../types';

export const SlotManagement: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SlotStatus>('ALL');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | ParkingZone>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | VehicleType>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);
  const [modalSlotId, setModalSlotId] = useState('');
  const [modalZone, setModalZone] = useState<ParkingZone>('A');
  const [modalType, setModalType] = useState<VehicleType>('Car');
  const [modalFloor, setModalFloor] = useState(1);
  const [modalStatus, setModalStatus] = useState<SlotStatus>('Available');
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const refreshSlots = () => {
    setSlots(parkingStore.getSlots());
  };

  useEffect(() => {
    refreshSlots();
    const unsub = parkingStore.subscribe(refreshSlots);
    return () => unsub();
  }, []);

  const filteredSlots = slots.filter(s => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.allocatedVehicleReg && s.allocatedVehicleReg.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesZone = zoneFilter === 'ALL' || s.zone === zoneFilter;
    const matchesType = typeFilter === 'ALL' || s.type === typeFilter;
    return matchesSearch && matchesStatus && matchesZone && matchesType;
  });

  const handleOpenAddModal = () => {
    setEditingSlot(null);
    const nextNumber = slots.length + 101;
    setModalSlotId(`A-${nextNumber}`);
    setModalZone('A');
    setModalType('Car');
    setModalFloor(1);
    setModalStatus('Available');
    setModalMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: ParkingSlot) => {
    setEditingSlot(slot);
    setModalSlotId(slot.id);
    setModalZone(slot.zone);
    setModalType(slot.type);
    setModalFloor(slot.floor);
    setModalStatus(slot.status);
    setModalMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSlotId.trim()) return;

    if (editingSlot) {
      parkingStore.updateSlot(editingSlot.id, {
        zone: modalZone,
        type: modalType,
        floor: modalFloor,
        status: modalStatus,
      });
      capEngine.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', `Admin update on Slot ${editingSlot.id}`, 200);
      setIsModalOpen(false);
    } else {
      const added = parkingStore.addSlot({
        id: modalSlotId.trim().toUpperCase(),
        zone: modalZone,
        slotNumber: parseInt(modalSlotId.replace(/\D/g, '')) || 100,
        type: modalType,
        status: modalStatus,
        floor: modalFloor
      });
      if (!added) {
        setModalMessage(`Slot ID "${modalSlotId}" already exists. Please choose a unique ID.`);
        return;
      }
      capEngine.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', `Admin added new Slot ${modalSlotId}`, 200);
      setIsModalOpen(false);
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    if (confirm(`Are you sure you want to delete parking slot ${slotId}?`)) {
      const deleted = parkingStore.deleteSlot(slotId);
      if (!deleted) {
        alert('Cannot delete this slot: it is currently Occupied or does not exist.');
      } else {
        capEngine.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', `Admin removed Slot ${slotId}`, 200);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              ADMIN CONTROL PANEL
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Parking Slot Management</h1>
          <p className="text-sm text-slate-400">
            Configure parking bays, modify slot types, monitor allocation locks, and audit real-time occupancy.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Parking Slot</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search slot or vehicle plate..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available (Green)</option>
            <option value="Occupied">Occupied (Red)</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="ALL">All Zones</option>
            <option value="A">Zone A (Car)</option>
            <option value="B">Zone B (SUV)</option>
            <option value="C">Zone C (Bike)</option>
            <option value="D">Zone D (EV)</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="Car">Car</option>
            <option value="SUV">SUV</option>
            <option value="Bike">Bike</option>
            <option value="EV">EV</option>
          </select>

          <span className="text-[11px] text-slate-400 font-mono ml-2">
            Showing {filteredSlots.length} of {slots.length}
          </span>
        </div>

      </div>

      {/* Slots Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Slot ID</th>
                <th className="py-3.5 px-4">Zone</th>
                <th className="py-3.5 px-4">Slot Type</th>
                <th className="py-3.5 px-4">Floor</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Parked Vehicle</th>
                <th className="py-3.5 px-4">Entry Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
              {filteredSlots.map(slot => {
                const isOccupied = slot.status === 'Occupied';
                const isAvailable = slot.status === 'Available';

                return (
                  <tr key={slot.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{slot.id}</td>
                    <td className="py-3.5 px-4 text-cyan-400">Zone {slot.zone}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {slot.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">Floor {slot.floor}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        isAvailable
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : isOccupied
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : isOccupied ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                        {slot.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {slot.allocatedVehicleReg ? (
                        <span className="text-white font-bold">{slot.allocatedVehicleReg}</span>
                      ) : (
                        <span className="text-slate-600 italic">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {slot.entryTime ? new Date(slot.entryTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(slot)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Slot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={slot.status === 'Occupied'}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingSlot ? `Edit Slot ${editingSlot.id}` : 'Add New Parking Slot'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalMessage && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {modalMessage}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Slot Identifier</label>
                <input
                  type="text"
                  value={modalSlotId}
                  onChange={e => setModalSlotId(e.target.value.toUpperCase())}
                  disabled={!!editingSlot}
                  required
                  placeholder="e.g. A-117"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Zone</label>
                  <select
                    value={modalZone}
                    onChange={e => setModalZone(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="A">Zone A</option>
                    <option value="B">Zone B</option>
                    <option value="C">Zone C</option>
                    <option value="D">Zone D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vehicle Type</label>
                  <select
                    value={modalType}
                    onChange={e => setModalType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Bike">Bike</option>
                    <option value="EV">EV</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={modalFloor}
                    onChange={e => setModalFloor(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={modalStatus}
                    onChange={e => setModalStatus(e.target.value as any)}
                    disabled={editingSlot?.status === 'Occupied'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white disabled:opacity-50"
                  >
                    <option value="Available">Available (Green)</option>
                    <option value="Occupied">Occupied (Red)</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingSlot ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
