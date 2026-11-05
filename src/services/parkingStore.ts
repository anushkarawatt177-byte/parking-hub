import {
  ParkingSlot,
  ParkingSession,
  ParkingTicket,
  TariffRule,
  VehicleType,
  ParkingZone,
  PaymentRecord,
  SynchronizationMode
} from '../types';

const INITIAL_TARIFFS: TariffRule[] = [
  { vehicleType: 'Car', firstHourRate: 5, subsequentHourlyRate: 3, dailyMaxRate: 35 },
  { vehicleType: 'Bike', firstHourRate: 2, subsequentHourlyRate: 1.5, dailyMaxRate: 15 },
  { vehicleType: 'SUV', firstHourRate: 8, subsequentHourlyRate: 4, dailyMaxRate: 50 },
  { vehicleType: 'EV', firstHourRate: 6, subsequentHourlyRate: 3.5, dailyMaxRate: 40 },
];

function generateInitialSlots(): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  
  // Zone A: Car Slots (16 slots, floors 1 & 2)
  for (let i = 1; i <= 16; i++) {
    const slotId = `A-${100 + i}`;
    const isOccupied = i === 1 || i === 3 || i === 7 || i === 12;
    slots.push({
      id: slotId,
      zone: 'A',
      slotNumber: 100 + i,
      type: 'Car',
      status: isOccupied ? 'Occupied' : 'Available',
      floor: i <= 8 ? 1 : 2,
      allocatedVehicleReg: isOccupied ? `DL-01-CA-${2000 + i}` : undefined,
      entryTime: isOccupied ? new Date(Date.now() - (i * 35 + 20) * 60000).toISOString() : undefined,
      lastUpdated: Date.now() - 3600000,
      version: 1
    });
  }

  // Zone B: SUV Slots (12 slots, floor 1)
  for (let i = 1; i <= 12; i++) {
    const slotId = `B-${200 + i}`;
    const isOccupied = i === 2 || i === 5 || i === 9;
    slots.push({
      id: slotId,
      zone: 'B',
      slotNumber: 200 + i,
      type: 'SUV',
      status: isOccupied ? 'Occupied' : 'Available',
      floor: 1,
      allocatedVehicleReg: isOccupied ? `MH-02-SV-${3100 + i}` : undefined,
      entryTime: isOccupied ? new Date(Date.now() - (i * 45 + 15) * 60000).toISOString() : undefined,
      lastUpdated: Date.now() - 3600000,
      version: 1
    });
  }

  // Zone C: Bike Slots (12 slots, floor 1)
  for (let i = 1; i <= 12; i++) {
    const slotId = `C-${300 + i}`;
    const isOccupied = i === 1 || i === 4 || i === 8 || i === 11;
    slots.push({
      id: slotId,
      zone: 'C',
      slotNumber: 300 + i,
      type: 'Bike',
      status: isOccupied ? 'Occupied' : 'Available',
      floor: 1,
      allocatedVehicleReg: isOccupied ? `KA-03-BK-${1000 + i}` : undefined,
      entryTime: isOccupied ? new Date(Date.now() - (i * 20 + 30) * 60000).toISOString() : undefined,
      lastUpdated: Date.now() - 3600000,
      version: 1
    });
  }

  // Zone D: EV / Priority Slots (8 slots, floor 1)
  for (let i = 1; i <= 8; i++) {
    const slotId = `D-${400 + i}`;
    const isOccupied = i === 2 || i === 6;
    slots.push({
      id: slotId,
      zone: 'D',
      slotNumber: 400 + i,
      type: 'EV',
      status: isOccupied ? 'Occupied' : 'Available',
      floor: 1,
      allocatedVehicleReg: isOccupied ? `TN-07-EV-${5000 + i}` : undefined,
      entryTime: isOccupied ? new Date(Date.now() - (i * 50 + 10) * 60000).toISOString() : undefined,
      lastUpdated: Date.now() - 3600000,
      version: 1
    });
  }

  return slots;
}

function generateInitialTickets(slots: ParkingSlot[]): ParkingTicket[] {
  const tickets: ParkingTicket[] = [];
  slots.filter(s => s.status === 'Occupied' && s.allocatedVehicleReg).forEach((slot, idx) => {
    tickets.push({
      ticketId: `TCK-${1000 + idx}`,
      registrationNumber: slot.allocatedVehicleReg!,
      vehicleType: slot.type,
      slotId: slot.id,
      zone: slot.zone,
      entryTime: slot.entryTime || new Date().toISOString(),
      barcode: `||| |||| | ||||| ${slot.id}`,
      ratePerHour: slot.type === 'SUV' ? 8 : slot.type === 'EV' ? 6 : slot.type === 'Car' ? 5 : 2,
      allocatedByProcessor: 'CPU-2 (Parking Allocation Processor)'
    });
  });
  return tickets;
}

function generateInitialSessions(): ParkingSession[] {
  return [
    {
      sessionId: 'SES-901',
      ticketId: 'TCK-0901',
      registrationNumber: 'DL-01-AB-1234',
      vehicleType: 'Car',
      slotId: 'A-102',
      entryTime: new Date(Date.now() - 180 * 60000).toISOString(),
      exitTime: new Date(Date.now() - 60 * 60000).toISOString(),
      durationMinutes: 120,
      totalFee: 11,
      paymentMethod: 'UPI/Fastag',
      paymentStatus: 'Paid',
      processedByExitProcessor: 'CPU-3',
      processedByBillingProcessor: 'CPU-4'
    },
    {
      sessionId: 'SES-902',
      ticketId: 'TCK-0902',
      registrationNumber: 'MH-12-PQ-9988',
      vehicleType: 'SUV',
      slotId: 'B-201',
      entryTime: new Date(Date.now() - 240 * 60000).toISOString(),
      exitTime: new Date(Date.now() - 90 * 60000).toISOString(),
      durationMinutes: 150,
      totalFee: 20,
      paymentMethod: 'Card',
      paymentStatus: 'Paid',
      processedByExitProcessor: 'CPU-3',
      processedByBillingProcessor: 'CPU-4'
    },
    {
      sessionId: 'SES-903',
      ticketId: 'TCK-0903',
      registrationNumber: 'KA-05-XY-7766',
      vehicleType: 'Bike',
      slotId: 'C-302',
      entryTime: new Date(Date.now() - 110 * 60000).toISOString(),
      exitTime: new Date(Date.now() - 30 * 60000).toISOString(),
      durationMinutes: 80,
      totalFee: 3.5,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      processedByExitProcessor: 'CPU-3',
      processedByBillingProcessor: 'CPU-4'
    },
    {
      sessionId: 'SES-904',
      ticketId: 'TCK-0904',
      registrationNumber: 'UP-16-ZZ-4321',
      vehicleType: 'EV',
      slotId: 'D-401',
      entryTime: new Date(Date.now() - 300 * 60000).toISOString(),
      exitTime: new Date(Date.now() - 120 * 60000).toISOString(),
      durationMinutes: 180,
      totalFee: 16.5,
      paymentMethod: 'Wallet',
      paymentStatus: 'Paid',
      processedByExitProcessor: 'CPU-3',
      processedByBillingProcessor: 'CPU-4'
    }
  ];
}

class ParkingStore {
  private slots: ParkingSlot[] = [];
  private tickets: ParkingTicket[] = [];
  private sessions: ParkingSession[] = [];
  private payments: PaymentRecord[] = [];
  private tariffs: TariffRule[] = INITIAL_TARIFFS;
  private listeners: (() => void)[] = [];
  private lock: boolean = false; // Simulated Mutex Lock for Processor 2

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const savedSlots = localStorage.getItem('cap_parking_slots');
      const savedTickets = localStorage.getItem('cap_parking_tickets');
      const savedSessions = localStorage.getItem('cap_parking_sessions');
      const savedTariffs = localStorage.getItem('cap_parking_tariffs');

      if (savedSlots) {
        this.slots = JSON.parse(savedSlots);
      } else {
        this.slots = generateInitialSlots();
      }

      if (savedTickets) {
        this.tickets = JSON.parse(savedTickets);
      } else {
        this.tickets = generateInitialTickets(this.slots);
      }

      if (savedSessions) {
        this.sessions = JSON.parse(savedSessions);
      } else {
        this.sessions = generateInitialSessions();
      }

      if (savedTariffs) {
        this.tariffs = JSON.parse(savedTariffs);
      }
    } catch {
      this.slots = generateInitialSlots();
      this.tickets = generateInitialTickets(this.slots);
      this.sessions = generateInitialSessions();
    }
  }

  public saveState() {
    try {
      localStorage.setItem('cap_parking_slots', JSON.stringify(this.slots));
      localStorage.setItem('cap_parking_tickets', JSON.stringify(this.tickets));
      localStorage.setItem('cap_parking_sessions', JSON.stringify(this.sessions));
      localStorage.setItem('cap_parking_tariffs', JSON.stringify(this.tariffs));
    } catch {
      // Ignore quota errors
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // Getters
  public getSlots(): ParkingSlot[] {
    return [...this.slots];
  }

  public getTickets(): ParkingTicket[] {
    return [...this.tickets];
  }

  public getSessions(): ParkingSession[] {
    return [...this.sessions];
  }

  public getTariffs(): TariffRule[] {
    return [...this.tariffs];
  }

  public getTariff(type: VehicleType): TariffRule {
    return this.tariffs.find(t => t.vehicleType === type) || this.tariffs[0];
  }

  public updateTariffs(newTariffs: TariffRule[]) {
    this.tariffs = newTariffs;
    this.saveState();
  }

  public calculateFee(vehicleType: VehicleType, durationMinutes: number): number {
    const tariff = this.getTariff(vehicleType);
    if (durationMinutes <= 15) {
      return 0; // Grace period 15 mins
    }
    const hours = Math.ceil(durationMinutes / 60);
    if (hours <= 1) {
      return tariff.firstHourRate;
    }
    const additionalHours = hours - 1;
    const calculated = tariff.firstHourRate + (additionalHours * tariff.subsequentHourlyRate);
    return Math.min(calculated, tariff.dailyMaxRate);
  }

  // Check duplicate vehicle entry
  public isVehicleAlreadyParked(reg: string): boolean {
    const cleanReg = reg.trim().toUpperCase();
    return this.slots.some(
      s => s.status === 'Occupied' && s.allocatedVehicleReg?.trim().toUpperCase() === cleanReg
    );
  }

  // Allocate Slot with Concurrency / Locking Support
  public allocateSlot(
    registrationNumber: string,
    vehicleType: VehicleType,
    preferredZone?: ParkingZone,
    syncMode: SynchronizationMode = 'Synchronized-Mutex'
  ): { success: boolean; ticket?: ParkingTicket; slot?: ParkingSlot; message: string; raceConditionDetected?: boolean } {
    const cleanReg = registrationNumber.trim().toUpperCase();
    
    // Check duplicate
    if (this.isVehicleAlreadyParked(cleanReg)) {
      return {
        success: false,
        message: `Vehicle ${cleanReg} is already parked in the system. Duplicate entry rejected.`
      };
    }

    // Mutex locking simulation
    if (syncMode === 'Synchronized-Mutex') {
      if (this.lock) {
        return { success: false, message: 'Processor 2 lock acquisition failed: resource is currently in a Critical Section.' };
      }
      this.lock = true;
    }

    try {
      // Find candidate slots
      let candidates = this.slots.filter(s => s.status === 'Available');
      
      // Preferred zone filter
      if (preferredZone) {
        const inZone = candidates.filter(s => s.zone === preferredZone);
        if (inZone.length > 0) candidates = inZone;
      }

      // Match vehicle type preference
      const typeMatched = candidates.filter(s => s.type === vehicleType);
      const targetList = typeMatched.length > 0 ? typeMatched : candidates;

      if (targetList.length === 0) {
        return {
          success: false,
          message: `No available slots matching vehicle type ${vehicleType}. Facility is at full capacity for this category.`
        };
      }

      // Pick optimal slot (lowest slotNumber in designated zone)
      const selectedSlot = targetList[0];

      // Atomic CAS or Mutex check
      if (syncMode === 'Atomic-CAS') {
        const currentVersion = selectedSlot.version;
        // Verify version has not changed
        if (selectedSlot.status !== 'Available') {
          return { success: false, message: 'CAS Conflict: Slot status mutated concurrently by another thread. Retrying...' };
        }
        selectedSlot.version = currentVersion + 1;
      }

      // Mark slot as occupied
      selectedSlot.status = 'Occupied';
      selectedSlot.allocatedVehicleReg = cleanReg;
      selectedSlot.entryTime = new Date().toISOString();
      selectedSlot.lastUpdated = Date.now();

      // Create Ticket
      const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      const tariff = this.getTariff(vehicleType);
      const ticket: ParkingTicket = {
        ticketId,
        registrationNumber: cleanReg,
        vehicleType,
        slotId: selectedSlot.id,
        zone: selectedSlot.zone,
        entryTime: selectedSlot.entryTime,
        barcode: `||| |||| | ||||| ${selectedSlot.id}`,
        ratePerHour: tariff.firstHourRate,
        allocatedByProcessor: 'CPU-2 (Parking Allocation Processor)'
      };

      this.tickets.unshift(ticket);
      this.saveState();

      return {
        success: true,
        ticket,
        slot: selectedSlot,
        message: `Allocated Slot ${selectedSlot.id} (Zone ${selectedSlot.zone}) to ${cleanReg} successfully.`
      };
    } finally {
      if (syncMode === 'Synchronized-Mutex') {
        this.lock = false;
      }
    }
  }

  // Release Slot & Checkout
  public releaseSlot(
    searchKey: string,
    paymentMethod: 'Cash' | 'Card' | 'UPI/Fastag' | 'Wallet' = 'UPI/Fastag'
  ): { success: boolean; session?: ParkingSession; message: string; receiptTicket?: ParkingTicket } {
    const key = searchKey.trim().toUpperCase();
    
    // Find matching slot
    const slot = this.slots.find(
      s => s.status === 'Occupied' && (
        s.allocatedVehicleReg?.toUpperCase() === key ||
        s.id.toUpperCase() === key
      )
    );

    // Or find matching ticket
    const ticket = this.tickets.find(
      t => t.ticketId.toUpperCase() === key || t.registrationNumber.toUpperCase() === key
    );

    if (!slot && !ticket) {
      return {
        success: false,
        message: `No active occupied parking session found for "${searchKey}". Please verify the Vehicle Registration or Ticket ID.`
      };
    }

    const targetSlot = slot || this.slots.find(s => s.id === ticket?.slotId);
    if (!targetSlot || targetSlot.status !== 'Occupied') {
      return {
        success: false,
        message: `Associated slot ${ticket?.slotId || ''} is not currently marked as occupied.`
      };
    }

    const reg = targetSlot.allocatedVehicleReg || ticket?.registrationNumber || 'UNKNOWN';
    const vehicleType = targetSlot.type;
    const entryTimeStr = targetSlot.entryTime || ticket?.entryTime || new Date(Date.now() - 3600000).toISOString();
    const entryTime = new Date(entryTimeStr);
    const exitTime = new Date();
    
    // Duration in minutes
    const diffMs = Math.max(exitTime.getTime() - entryTime.getTime(), 120000); // minimum 2 mins
    const durationMinutes = Math.round(diffMs / 60000);
    const fee = this.calculateFee(vehicleType, durationMinutes);

    // Create session record
    const sessionId = `SES-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticketId = ticket?.ticketId || `TCK-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;

    const session: ParkingSession = {
      sessionId,
      ticketId,
      registrationNumber: reg,
      vehicleType,
      slotId: targetSlot.id,
      entryTime: entryTimeStr,
      exitTime: exitTime.toISOString(),
      durationMinutes,
      totalFee: fee,
      paymentMethod,
      paymentStatus: 'Paid',
      processedByExitProcessor: 'CPU-3 (Vehicle Exit Processor)',
      processedByBillingProcessor: 'CPU-4 (Billing & Reporting Processor)'
    };

    // Release slot
    targetSlot.status = 'Available';
    targetSlot.allocatedVehicleReg = undefined;
    targetSlot.entryTime = undefined;
    targetSlot.lastUpdated = Date.now();
    targetSlot.version += 1;

    // Record payment
    this.payments.unshift({
      paymentId: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
      sessionId,
      ticketId,
      amount: fee,
      timestamp: exitTime.toISOString(),
      method: paymentMethod,
      tax: Math.round(fee * 0.18 * 100) / 100
    });

    this.sessions.unshift(session);
    this.saveState();

    return {
      success: true,
      session,
      receiptTicket: ticket,
      message: `Vehicle ${reg} checked out. Slot ${targetSlot.id} released to Available. Total Fee: $${fee.toFixed(2)}.`
    };
  }

  // Admin Slot Management CRUD
  public addSlot(slot: Omit<ParkingSlot, 'version' | 'lastUpdated'>): boolean {
    if (this.slots.some(s => s.id.toUpperCase() === slot.id.toUpperCase())) {
      return false;
    }
    this.slots.push({
      ...slot,
      version: 1,
      lastUpdated: Date.now()
    });
    this.saveState();
    return true;
  }

  public updateSlot(slotId: string, updates: Partial<ParkingSlot>): boolean {
    const idx = this.slots.findIndex(s => s.id === slotId);
    if (idx === -1) return false;
    this.slots[idx] = {
      ...this.slots[idx],
      ...updates,
      lastUpdated: Date.now(),
      version: this.slots[idx].version + 1
    };
    this.saveState();
    return true;
  }

  public deleteSlot(slotId: string): boolean {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || slot.status === 'Occupied') {
      return false; // Cannot delete occupied slot
    }
    this.slots = this.slots.filter(s => s.id !== slotId);
    this.saveState();
    return true;
  }

  // Reset to default sample state
  public resetToDefault() {
    this.slots = generateInitialSlots();
    this.tickets = generateInitialTickets(this.slots);
    this.sessions = generateInitialSessions();
    this.tariffs = INITIAL_TARIFFS;
    this.saveState();
  }
}

export const parkingStore = new ParkingStore();
