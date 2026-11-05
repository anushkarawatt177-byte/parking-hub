import {
  ProcessorCore,
  ProcessorId,
  ProcessorTask,
  PipelineVehicleInstruction,
  PipelineStageName,
  CacheLine,
  MemoryHierarchyStats,
  MESIState,
  BenchmarkResult,
  SynchronizationMode,
  VehicleType,
  ParkingZone
} from '../types';
import { parkingStore } from './parkingStore';

export const PIPELINE_STAGES: { code: PipelineStageName; name: string; description: string; hardwareUnit: string }[] = [
  { code: 'VR', name: 'Vehicle Registration', description: 'Validate plate regex, capture timestamp and sensor metadata', hardwareUnit: 'CPU-1 ALUs & Decode Unit' },
  { code: 'SAC', name: 'Slot Availability Check', description: 'Query L1/L2 cache and memory for free matching slots', hardwareUnit: 'CPU-2 Cache Controller & Bus' },
  { code: 'PSA', name: 'Parking Slot Allocation', description: 'Critical Section: Mutex lock acquisition & slot mutation', hardwareUnit: 'CPU-2 Execution Core (CAS/Lock)' },
  { code: 'TG', name: 'Ticket Generation', description: 'Generate cryptographic ticket ID, barcode, and tariff payload', hardwareUnit: 'CPU-4 Cryptographic Engine' },
  { code: 'DS', name: 'Database Storage', description: 'Write-through commit to persistent secondary storage (MySQL)', hardwareUnit: 'DMA Controller & Storage Bus' },
];

class CapEngine {
  // 4 Multiprocessors
  private processors: Record<ProcessorId, ProcessorCore> = {
    'CPU-1': {
      id: 'CPU-1',
      name: 'Processor 1: Vehicle Entry Processor',
      role: 'Vehicle Ingestion & Registration',
      description: 'Handles vehicle registration, plate validation, and sensor signal ingestion concurrently.',
      status: 'Idle',
      tasksCompleted: 42,
      activeThreads: 1,
      clockCycles: 1420,
      utilization: 24,
      instructionsProcessed: 210,
      registers: {
        PC: '0x00401000',
        IR: 'MOV R1, [REG_BUFFER]',
        ACC: 1,
        MAR: '0x1000FFA0',
        MDR: '0x444C3031' // ASCII DL01
      },
      temperature: 38.5
    },
    'CPU-2': {
      id: 'CPU-2',
      name: 'Processor 2: Parking Allocation Processor',
      role: 'Slot Allocation & Concurrency Control',
      description: 'Executes synchronized search and allocation. Enforces Mutex locks to prevent double-booking.',
      status: 'Idle',
      tasksCompleted: 38,
      activeThreads: 2,
      clockCycles: 1850,
      utilization: 42,
      instructionsProcessed: 340,
      registers: {
        PC: '0x00402040',
        IR: 'LOCK CMPXCHG [SLOT_ADDR], R2',
        ACC: 0,
        MAR: '0x2000A101',
        MDR: '0x00000001'
      },
      temperature: 44.2
    },
    'CPU-3': {
      id: 'CPU-3',
      name: 'Processor 3: Vehicle Exit Processor',
      role: 'Checkout & Slot Deallocation',
      description: 'Handles vehicle checkout, duration calculation, and releases occupied slots back to Available.',
      status: 'Idle',
      tasksCompleted: 29,
      activeThreads: 1,
      clockCycles: 1120,
      utilization: 18,
      instructionsProcessed: 175,
      registers: {
        PC: '0x00403080',
        IR: 'SUB TIME_EXIT, TIME_ENTRY',
        ACC: 120,
        MAR: '0x3000B202',
        MDR: '0x00000000'
      },
      temperature: 36.8
    },
    'CPU-4': {
      id: 'CPU-4',
      name: 'Processor 4: Billing & Reporting Processor',
      role: 'Tariff Calculation & Analytics',
      description: 'Calculates parking revenue, generates receipts, and aggregates daily/monthly statistics.',
      status: 'Idle',
      tasksCompleted: 31,
      activeThreads: 1,
      clockCycles: 1390,
      utilization: 29,
      instructionsProcessed: 230,
      registers: {
        PC: '0x004040A0',
        IR: 'MUL R1, TARIFF_RATE',
        ACC: 15,
        MAR: '0x4000C303',
        MDR: '0x0000000F'
      },
      temperature: 40.1
    }
  };

  // Processor Task Queue
  private taskQueue: ProcessorTask[] = [];

  // Pipelining State
  private pipelineClockCycle: number = 1;
  private pipelineInstructions: PipelineVehicleInstruction[] = [];
  private pipelineTimer: any = null;
  private isPipelineRunning: boolean = false;
  private pipelineSpeedMs: number = 1000;
  private pipelineStallCount: number = 0;

  // Memory & Cache State
  private l1Cache: CacheLine[] = [];
  private cacheStats: MemoryHierarchyStats = {
    l1Hits: 148,
    l1Misses: 22,
    l2Hits: 18,
    l2Misses: 4,
    ramAccesses: 4,
    diskWrites: 36,
    l1LatencyNs: 1,
    l2LatencyNs: 10,
    ramLatencyNs: 100,
    diskLatencyMs: 10,
    coherenceInvalidations: 14,
    coherenceBroadcasts: 28
  };

  // Synchronization settings
  private syncMode: SynchronizationMode = 'Synchronized-Mutex';
  private raceConditionLogs: { timestamp: string; thread1: string; thread2: string; slotId: string; outcome: string }[] = [];

  // Benchmarks
  private recentBenchmarks: BenchmarkResult[] = [];

  // Listeners
  private listeners: (() => void)[] = [];

  constructor() {
    this.initializeCache();
    this.initializePipelineSample();
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

  // --- Processors ---
  public getProcessors(): Record<ProcessorId, ProcessorCore> {
    return { ...this.processors };
  }

  public getTaskQueue(): ProcessorTask[] {
    return [...this.taskQueue];
  }

  public recordProcessorActivity(
    processorId: ProcessorId,
    taskType: ProcessorTask['taskType'],
    details: string,
    durationMs: number = 250,
    vehicleReg?: string,
    slotId?: string
  ) {
    const proc = this.processors[processorId];
    if (!proc) return;

    proc.status = 'Busy';
    proc.currentTask = details;
    proc.activeThreads = Math.min(4, proc.activeThreads + 1);
    proc.clockCycles += Math.floor(durationMs * 1.5);
    proc.instructionsProcessed += Math.floor(Math.random() * 8 + 3);
    proc.utilization = Math.min(98, Math.max(30, Math.floor(proc.utilization + Math.random() * 30)));
    proc.temperature = Math.min(75, Math.max(35, Math.round((proc.temperature + 0.8) * 10) / 10));

    // Update registers
    const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
    proc.registers.PC = `0x0040${randomHex.substring(0, 4)}`;
    proc.registers.MAR = `0x1000${randomHex.substring(2, 6)}`;
    if (vehicleReg) proc.registers.IR = `EXEC_${taskType} [${vehicleReg}]`;

    const taskId = `TSK-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
    const task: ProcessorTask = {
      taskId,
      processorId,
      taskType,
      vehicleReg,
      slotId,
      startTime: Date.now(),
      durationMs,
      status: 'RUNNING',
      details
    };

    this.taskQueue.unshift(task);
    if (this.taskQueue.length > 50) this.taskQueue.pop();
    this.notify();

    setTimeout(() => {
      proc.status = 'Idle';
      proc.currentTask = undefined;
      proc.tasksCompleted += 1;
      proc.activeThreads = Math.max(0, proc.activeThreads - 1);
      proc.utilization = Math.max(12, Math.floor(proc.utilization * 0.7));
      proc.temperature = Math.max(35, Math.round((proc.temperature - 0.4) * 10) / 10);
      task.status = 'COMPLETED';
      task.endTime = Date.now();
      this.notify();
    }, durationMs);
  }

  // --- Memory Hierarchy & Cache Coherence (MESI) ---
  private initializeCache() {
    const slots = parkingStore.getSlots().slice(0, 16);
    this.l1Cache = slots.map((s, idx) => ({
      slotId: s.id,
      tag: `0xTAG_${s.id}`,
      data: {
        status: s.status,
        vehicleReg: s.allocatedVehicleReg,
        version: s.version
      },
      mesiState: s.status === 'Occupied' ? 'Modified' : ('Shared' as MESIState),
      valid: true,
      dirty: s.status === 'Occupied',
      lastAccessTime: Date.now() - (16 - idx) * 120000,
      accessCount: Math.floor(Math.random() * 20 + 5)
    }));
  }

  public getL1Cache(): CacheLine[] {
    return [...this.l1Cache];
  }

  public getCacheStats(): MemoryHierarchyStats {
    return { ...this.cacheStats };
  }

  public accessSlotCache(slotId: string, isWrite: boolean = false): { hit: boolean; level: 'L1' | 'L2' | 'RAM'; latencyNs: number } {
    const line = this.l1Cache.find(c => c.slotId === slotId && c.valid);
    if (line) {
      this.cacheStats.l1Hits++;
      line.accessCount++;
      line.lastAccessTime = Date.now();

      if (isWrite) {
        // MESI Transition: becomes Modified, dirty bit set
        if (line.mesiState === 'Shared') {
          this.cacheStats.coherenceBroadcasts++;
          this.cacheStats.coherenceInvalidations++;
        }
        line.mesiState = 'Modified';
        line.dirty = true;
      }
      this.notify();
      return { hit: true, level: 'L1', latencyNs: this.cacheStats.l1LatencyNs };
    }

    // L1 Miss -> check L2 simulation
    this.cacheStats.l1Misses++;
    const isL2Hit = Math.random() > 0.3;
    if (isL2Hit) {
      this.cacheStats.l2Hits++;
      this.cacheStats.coherenceBroadcasts++;
      this.notify();
      return { hit: true, level: 'L2', latencyNs: this.cacheStats.l2LatencyNs };
    }

    // L2 Miss -> RAM
    this.cacheStats.l2Misses++;
    this.cacheStats.ramAccesses++;
    if (isWrite) {
      this.cacheStats.diskWrites++;
    }
    this.notify();
    return { hit: false, level: 'RAM', latencyNs: this.cacheStats.ramLatencyNs };
  }

  public invalidateCacheLine(slotId: string) {
    const line = this.l1Cache.find(c => c.slotId === slotId);
    if (line) {
      line.mesiState = 'Invalid';
      line.valid = false;
      this.cacheStats.coherenceInvalidations++;
      this.cacheStats.coherenceBroadcasts++;
      this.notify();
    }
  }

  public updateCacheLine(slotId: string, status: any, vehicleReg?: string) {
    let line = this.l1Cache.find(c => c.slotId === slotId);
    if (!line) {
      // LRU Eviction: replace line with lowest accessCount or oldest access
      const lruIndex = this.l1Cache.reduce((minIdx, curr, idx, arr) => 
        curr.lastAccessTime < arr[minIdx].lastAccessTime ? idx : minIdx, 0
      );
      line = this.l1Cache[lruIndex];
      line.slotId = slotId;
      line.tag = `0xTAG_${slotId}`;
    }
    line.data.status = status;
    line.data.vehicleReg = vehicleReg;
    line.data.version += 1;
    line.mesiState = 'Modified';
    line.valid = true;
    line.dirty = true;
    line.lastAccessTime = Date.now();
    line.accessCount++;
    this.cacheStats.coherenceBroadcasts++;
    this.notify();
  }

  // --- Instruction Pipelining Simulator ---
  private initializePipelineSample() {
    this.pipelineInstructions = [
      {
        instructionId: 'INST-01',
        vehicleReg: 'KA-01-AB-1111',
        vehicleType: 'Car',
        currentStageIndex: 4,
        stallCount: 0,
        history: ['VR', 'SAC', 'PSA', 'TG', 'DS']
      },
      {
        instructionId: 'INST-02',
        vehicleReg: 'MH-04-CD-2222',
        vehicleType: 'SUV',
        currentStageIndex: 3,
        stallCount: 0,
        history: ['-', 'VR', 'SAC', 'PSA', 'TG']
      },
      {
        instructionId: 'INST-03',
        vehicleReg: 'DL-08-EF-3333',
        vehicleType: 'Bike',
        currentStageIndex: 2,
        stallCount: 0,
        history: ['-', '-', 'VR', 'SAC', 'PSA']
      },
      {
        instructionId: 'INST-04',
        vehicleReg: 'TN-09-GH-4444',
        vehicleType: 'EV',
        currentStageIndex: 1,
        stallCount: 0,
        history: ['-', '-', '-', 'VR', 'SAC']
      },
      {
        instructionId: 'INST-05',
        vehicleReg: 'UP-16-JK-5555',
        vehicleType: 'Car',
        currentStageIndex: 0,
        stallCount: 0,
        history: ['-', '-', '-', '-', 'VR']
      }
    ];
    this.pipelineClockCycle = 5;
  }

  public getPipelineInstructions(): PipelineVehicleInstruction[] {
    return [...this.pipelineInstructions];
  }

  public getPipelineClockCycle(): number {
    return this.pipelineClockCycle;
  }

  public isPipelineActive(): boolean {
    return this.isPipelineRunning;
  }

  public getPipelineStalls(): number {
    return this.pipelineStallCount;
  }

  public addVehicleToPipeline(vehicleReg: string, vehicleType: VehicleType, zone?: ParkingZone) {
    const instId = `INST-${(this.pipelineInstructions.length + 1).toString().padStart(2, '0')}`;
    const leadingDashes = Array(this.pipelineClockCycle - 1).fill('-');
    this.pipelineInstructions.push({
      instructionId: instId,
      vehicleReg: vehicleReg.toUpperCase(),
      vehicleType,
      requestedZone: zone,
      currentStageIndex: -1, // not yet entered
      stallCount: 0,
      history: leadingDashes
    });
    this.notify();
  }

  public stepPipelineClock() {
    this.pipelineClockCycle++;
    let anyStallOccurred = false;

    // Check for structural / data hazard
    // Stage 2 is PSA (Parking Slot Allocation) which requires the Mutex lock on CPU-2
    // If two vehicles need the same slot lock at Stage 2, a hazard stall is inserted
    let psaCount = 0;

    for (const inst of this.pipelineInstructions) {
      if (inst.currentStageIndex >= 4) {
        // Already completed
        inst.history.push('-');
        continue;
      }

      if (inst.currentStageIndex === -1) {
        // Enters Stage 0 (VR)
        inst.currentStageIndex = 0;
        inst.history.push('VR');
        this.recordProcessorActivity('CPU-1', 'ENTRY_REGISTER', `Pipelined Ingestion: ${inst.vehicleReg}`, 300, inst.vehicleReg);
        continue;
      }

      const nextStage = inst.currentStageIndex + 1;
      
      // Simulate structural hazard on PSA (Stage 2)
      if (nextStage === 2) {
        psaCount++;
        if (psaCount > 1) {
          // Hazard stall!
          inst.stallCount++;
          inst.stallReason = 'Structural Hazard: Hardware Mutex Lock Contention on Slot Allocator (CPU-2)';
          inst.history.push('STALL');
          anyStallOccurred = true;
          this.pipelineStallCount++;
          continue;
        }
      }

      inst.currentStageIndex = nextStage;
      const stageCode = PIPELINE_STAGES[nextStage].code;
      inst.history.push(stageCode);

      // Trigger processor actions
      if (stageCode === 'SAC') {
        this.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', `Slot Search: ${inst.vehicleReg}`, 200, inst.vehicleReg);
        this.accessSlotCache('A-101', false);
      } else if (stageCode === 'PSA') {
        this.recordProcessorActivity('CPU-2', 'SLOT_ALLOCATE', `Lock & Mutate Slot: ${inst.vehicleReg}`, 250, inst.vehicleReg);
        this.accessSlotCache('A-101', true);
      } else if (stageCode === 'TG') {
        this.recordProcessorActivity('CPU-4', 'BILLING_CALCULATE', `Ticket Token Generation: ${inst.vehicleReg}`, 200, inst.vehicleReg);
      } else if (stageCode === 'DS') {
        inst.completedInCycle = this.pipelineClockCycle;
        this.recordProcessorActivity('CPU-1', 'CACHE_FLUSH', `DB Commit & Write-through: ${inst.vehicleReg}`, 300, inst.vehicleReg);
      }
    }

    this.notify();
  }

  public startAutoPipeline(speedMs: number = 1000) {
    this.pipelineSpeedMs = speedMs;
    this.isPipelineRunning = true;
    if (this.pipelineTimer) clearInterval(this.pipelineTimer);
    this.pipelineTimer = setInterval(() => {
      this.stepPipelineClock();
    }, speedMs);
    this.notify();
  }

  public pauseAutoPipeline() {
    this.isPipelineRunning = false;
    if (this.pipelineTimer) {
      clearInterval(this.pipelineTimer);
      this.pipelineTimer = null;
    }
    this.notify();
  }

  public resetPipeline() {
    this.pauseAutoPipeline();
    this.pipelineClockCycle = 1;
    this.pipelineStallCount = 0;
    this.pipelineInstructions = [];
    this.initializePipelineSample();
    this.notify();
  }

  // --- Synchronization Lab: Race Condition Demo ---
  public getSyncMode(): SynchronizationMode {
    return this.syncMode;
  }

  public setSyncMode(mode: SynchronizationMode) {
    this.syncMode = mode;
    this.notify();
  }

  public getRaceConditionLogs() {
    return [...this.raceConditionLogs];
  }

  public clearRaceConditionLogs() {
    this.raceConditionLogs = [];
    this.notify();
  }

  public async runConcurrentDoubleAllocationSimulation(): Promise<{
    raceOccurred: boolean;
    slotId: string;
    details: string;
  }> {
    // Pick an available slot
    const availableSlot = parkingStore.getSlots().find(s => s.status === 'Available');
    if (!availableSlot) {
      return { raceOccurred: false, slotId: 'None', details: 'No available slots found to test.' };
    }

    const testSlotId = availableSlot.id;
    const thread1Reg = `CAR-THREAD1-${Math.floor(100 + Math.random() * 900)}`;
    const thread2Reg = `CAR-THREAD2-${Math.floor(100 + Math.random() * 900)}`;

    if (this.syncMode === 'Unsynchronized (Race Condition Demo)') {
      // Unsynchronized: Thread 1 and Thread 2 read simultaneously BEFORE either writes!
      // This causes both to believe slot is available and both allocate it (Classic CAP Race Condition Bug)
      availableSlot.allocatedVehicleReg = `${thread1Reg} & ${thread2Reg} [COLLISION]`;
      availableSlot.status = 'Occupied';
      parkingStore.saveState();

      const log = {
        timestamp: new Date().toLocaleTimeString(),
        thread1: `Thread-1 (reg: ${thread1Reg})`,
        thread2: `Thread-2 (reg: ${thread2Reg})`,
        slotId: testSlotId,
        outcome: `CRITICAL RACE HAZARD: Both threads read slot ${testSlotId} as Available simultaneously. Double-booking occurred! Both vehicles assigned to ${testSlotId}.`
      };
      this.raceConditionLogs.unshift(log);
      this.notify();
      return { raceOccurred: true, slotId: testSlotId, details: log.outcome };
    } else {
      // Synchronized / CAS: First thread grabs Mutex/Lock, second thread is serialized or safely rejected/re-routed
      const res1 = parkingStore.allocateSlot(thread1Reg, 'Car', undefined, this.syncMode);
      const res2 = parkingStore.allocateSlot(thread2Reg, 'Car', undefined, this.syncMode);

      const log = {
        timestamp: new Date().toLocaleTimeString(),
        thread1: `Thread-1 (reg: ${thread1Reg}) -> Slot ${res1.slot?.id || 'Allocated'}`,
        thread2: `Thread-2 (reg: ${thread2Reg}) -> Slot ${res2.slot?.id || 'Allocated'}`,
        slotId: testSlotId,
        outcome: `THREAD-SAFE: Synchronization lock acquired. Thread 1 got ${res1.slot?.id}. Thread 2 was safely serialized and allocated ${res2.slot?.id}. No collision.`
      };
      this.raceConditionLogs.unshift(log);
      this.notify();
      return { raceOccurred: false, slotId: testSlotId, details: log.outcome };
    }
  }

  // --- Benchmarking Engine (10, 50, 100, 500 Vehicles) ---
  public getRecentBenchmarks(): BenchmarkResult[] {
    return [...this.recentBenchmarks];
  }

  public async runBenchmark(vehicleCount: number): Promise<BenchmarkResult> {
    // Simulation parameters grounded in Computer Architecture math:
    // Sequential execution: 1 core executes all 5 stages for N vehicles:
    // T_seq = N * (t_VR + t_SAC + t_PSA + t_TG + t_DS)
    // t_stage approx 4.8ms on simulated hardware
    const stageDurationMs = 4.8;
    const stages = 5;
    const sequentialTimeMs = Math.round(vehicleCount * stages * stageDurationMs * (1 + (Math.random() * 0.05)));

    // Multiprocessor / Pipelined execution:
    // Pipeline throughput approaches 1 instruction per cycle after k cycles
    // T_par = (stages + vehicleCount - 1 + hazardStalls) * stageDurationMs / cores
    const parallelCores = 4;
    const hazardStalls = Math.floor(vehicleCount * 0.06); // 6% lock contention
    const parallelIdealMs = (stages + vehicleCount - 1 + hazardStalls) * stageDurationMs;
    // With 4 cores + parallel queue load balancing (Work Stealing)
    const parallelTimeMs = Math.round((parallelIdealMs / (parallelCores * 0.88)) + (Math.random() * 4));

    const speedup = Math.round((sequentialTimeMs / parallelTimeMs) * 100) / 100;
    const efficiency = Math.round((speedup / parallelCores) * 100);
    const throughputPerSec = Math.round((vehicleCount / (parallelTimeMs / 1000)) * 10) / 10;

    const core1Util = Math.round(75 + Math.random() * 15);
    const core2Util = Math.round(85 + Math.random() * 12);
    const core3Util = Math.round(65 + Math.random() * 20);
    const core4Util = Math.round(70 + Math.random() * 18);

    const result: BenchmarkResult = {
      vehicleCount,
      sequentialTimeMs,
      parallelTimeMs,
      speedup,
      efficiency,
      throughputPerSec,
      coreUtilization: [core1Util, core2Util, core3Util, core4Util],
      timestamp: new Date().toLocaleTimeString(),
      syncMode: this.syncMode
    };

    this.recentBenchmarks.unshift(result);
    if (this.recentBenchmarks.length > 10) this.recentBenchmarks.pop();

    // Pulse processor stats
    Object.values(this.processors).forEach((p, idx) => {
      p.instructionsProcessed += vehicleCount * 2;
      p.clockCycles += vehicleCount * 10;
      p.tasksCompleted += Math.floor(vehicleCount / 4);
      p.utilization = result.coreUtilization[idx];
    });

    this.notify();
    return result;
  }
}

export const capEngine = new CapEngine();
