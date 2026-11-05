export type VehicleType = 'Car' | 'Bike' | 'SUV' | 'EV';

export type SlotStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';

export type ParkingZone = 'A' | 'B' | 'C' | 'D';

export interface ParkingSlot {
  id: string; // e.g. "A-101"
  zone: ParkingZone;
  slotNumber: number;
  type: VehicleType;
  status: SlotStatus;
  allocatedVehicleReg?: string;
  entryTime?: string;
  floor: number;
  lastUpdated: number;
  version: number; // for CAS (Compare-And-Swap) locking
}

export interface Vehicle {
  registrationNumber: string;
  type: VehicleType;
  ownerName?: string;
  phone?: string;
  entryTime: string;
  slotId?: string;
  ticketId?: string;
}

export interface ParkingTicket {
  ticketId: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  slotId: string;
  zone: ParkingZone;
  entryTime: string;
  barcode: string;
  ratePerHour: number;
  allocatedByProcessor: string;
}

export interface ParkingSession {
  sessionId: string;
  ticketId: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  slotId: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  totalFee: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI/Fastag' | 'Wallet';
  paymentStatus: 'Paid' | 'Pending';
  processedByExitProcessor: string;
  processedByBillingProcessor: string;
}

export interface PaymentRecord {
  paymentId: string;
  sessionId: string;
  ticketId: string;
  amount: number;
  timestamp: string;
  method: 'Cash' | 'Card' | 'UPI/Fastag' | 'Wallet';
  tax: number;
}

// ================= CAP ARCHITECTURE TYPES =================

export type ProcessorId = 'CPU-1' | 'CPU-2' | 'CPU-3' | 'CPU-4';

export type ProcessorStatus = 'Idle' | 'Busy' | 'Completed' | 'Stalled';

export interface ProcessorCore {
  id: ProcessorId;
  name: string;
  role: string;
  description: string;
  status: ProcessorStatus;
  currentTask?: string;
  tasksCompleted: number;
  activeThreads: number;
  clockCycles: number;
  utilization: number; // percentage 0 - 100
  instructionsProcessed: number;
  registers: {
    PC: string; // Program Counter
    IR: string; // Instruction Register
    ACC: number; // Accumulator
    MAR: string; // Memory Address Register
    MDR: string; // Memory Data Register
  };
  temperature: number; // e.g. 42 C
}

export type PipelineStageName = 'VR' | 'SAC' | 'PSA' | 'TG' | 'DS';

export interface PipelineStageInfo {
  code: PipelineStageName;
  name: string;
  description: string;
  hardwareUnit: string;
}

export interface PipelineVehicleInstruction {
  instructionId: string;
  vehicleReg: string;
  vehicleType: VehicleType;
  requestedZone?: ParkingZone;
  currentStageIndex: number; // 0 to 4 (-1 if waiting, 5 if retired)
  stallCount: number;
  stallReason?: string;
  completedInCycle?: number;
  allocatedSlotId?: string;
  history: (PipelineStageName | 'STALL' | '-')[]; // stage at cycle i
}

export type MESIState = 'Modified' | 'Exclusive' | 'Shared' | 'Invalid';

export interface CacheLine {
  slotId: string;
  tag: string;
  data: {
    status: SlotStatus;
    vehicleReg?: string;
    version: number;
  };
  mesiState: MESIState;
  valid: boolean;
  dirty: boolean;
  lastAccessTime: number;
  accessCount: number;
}

export interface MemoryHierarchyStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  ramAccesses: number;
  diskWrites: number;
  l1LatencyNs: number; // 1 ns
  l2LatencyNs: number; // 10 ns
  ramLatencyNs: number; // 100 ns
  diskLatencyMs: number; // 10 ms
  coherenceInvalidations: number;
  coherenceBroadcasts: number;
}

export interface ProcessorTask {
  taskId: string;
  processorId: ProcessorId;
  taskType: 'ENTRY_REGISTER' | 'SLOT_ALLOCATE' | 'EXIT_PROCESS' | 'BILLING_CALCULATE' | 'CACHE_FLUSH';
  vehicleReg?: string;
  slotId?: string;
  startTime: number;
  endTime?: number;
  durationMs: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  details: string;
  lockAcquired?: boolean;
}

export type SchedulingAlgorithm = 'Round-Robin' | 'Work-Stealing (Least Loaded)' | 'Priority-Based';

export type SynchronizationMode = 'Synchronized-Mutex' | 'Atomic-CAS' | 'Unsynchronized (Race Condition Demo)';

export interface BenchmarkResult {
  vehicleCount: number;
  sequentialTimeMs: number;
  parallelTimeMs: number;
  speedup: number;
  efficiency: number; // Speedup / 4 cores
  throughputPerSec: number;
  coreUtilization: number[];
  timestamp: string;
  syncMode: SynchronizationMode;
}

export interface TariffRule {
  vehicleType: VehicleType;
  firstHourRate: number;
  subsequentHourlyRate: number;
  dailyMaxRate: number;
}
