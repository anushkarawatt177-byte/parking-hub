export const MYSQL_SCHEMA_SQL = `-- =====================================================================
-- SMART PARKING MANAGEMENT PLATFORM (CAP MULTIPROCESSOR ARCHITECTURE)
-- Database: MySQL 8.0+
-- Generated for Computer Architecture & Parallel Processing Coursework
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smart_parking_cap;
USE smart_parking_cap;

-- ---------------------------------------------------------------------
-- Table 1: Users (Operators, Admins, CAP Evaluators)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'OPERATOR', 'AUDITOR', 'PROFESSOR') NOT NULL DEFAULT 'OPERATOR',
    email VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 2: ParkingSlots
-- Includes version field for Optimistic Concurrency Control / CAS locking
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ParkingSlots (
    slot_id VARCHAR(10) PRIMARY KEY,
    zone ENUM('A', 'B', 'C', 'D') NOT NULL,
    slot_number INT NOT NULL,
    slot_type ENUM('Car', 'Bike', 'SUV', 'EV') NOT NULL,
    status ENUM('Available', 'Occupied', 'Reserved', 'Maintenance') NOT NULL DEFAULT 'Available',
    floor INT NOT NULL DEFAULT 1,
    allocated_vehicle_reg VARCHAR(20) DEFAULT NULL,
    entry_time TIMESTAMP NULL DEFAULT NULL,
    version INT NOT NULL DEFAULT 1 COMMENT 'Used for CAS lock concurrency control',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_zone_status (zone, status),
    INDEX idx_type_status (slot_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 3: Vehicles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Vehicles (
    registration_number VARCHAR(20) PRIMARY KEY,
    vehicle_type ENUM('Car', 'Bike', 'SUV', 'EV') NOT NULL,
    owner_name VARCHAR(100) DEFAULT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vehicle_type (vehicle_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 4: ParkingSessions
-- Represents active and completed vehicle stays
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ParkingSessions (
    session_id VARCHAR(20) PRIMARY KEY,
    ticket_id VARCHAR(30) NOT NULL UNIQUE,
    registration_number VARCHAR(20) NOT NULL,
    slot_id VARCHAR(10) NOT NULL,
    vehicle_type ENUM('Car', 'Bike', 'SUV', 'EV') NOT NULL,
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP NULL DEFAULT NULL,
    duration_minutes INT DEFAULT NULL,
    total_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('Pending', 'Paid', 'Waived') NOT NULL DEFAULT 'Pending',
    processed_by_exit_processor VARCHAR(20) DEFAULT 'CPU-3',
    processed_by_billing_processor VARCHAR(20) DEFAULT 'CPU-4',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_vehicle FOREIGN KEY (registration_number) REFERENCES Vehicles(registration_number) ON UPDATE CASCADE,
    CONSTRAINT fk_session_slot FOREIGN KEY (slot_id) REFERENCES ParkingSlots(slot_id) ON UPDATE CASCADE,
    INDEX idx_entry_time (entry_time),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 5: Payments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Payments (
    payment_id VARCHAR(30) PRIMARY KEY,
    session_id VARCHAR(20) NOT NULL,
    ticket_id VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('Cash', 'Card', 'UPI/Fastag', 'Wallet') NOT NULL DEFAULT 'UPI/Fastag',
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_session FOREIGN KEY (session_id) REFERENCES ParkingSessions(session_id) ON DELETE CASCADE,
    INDEX idx_payment_time (payment_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 6: ProcessorTasks
-- CAP Architecture Execution Log for Multiprocessor Cores
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ProcessorTasks (
    task_id VARCHAR(30) PRIMARY KEY,
    processor_id ENUM('CPU-1', 'CPU-2', 'CPU-3', 'CPU-4') NOT NULL,
    task_type ENUM('ENTRY_REGISTER', 'SLOT_ALLOCATE', 'EXIT_PROCESS', 'BILLING_CALCULATE', 'CACHE_FLUSH') NOT NULL,
    vehicle_reg VARCHAR(20) DEFAULT NULL,
    slot_id VARCHAR(10) DEFAULT NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    status ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED') NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_processor_status (processor_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table 7: CacheCoherenceLogs
-- Memory Hierarchy and MESI Protocol State Invalidation Auditing
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS CacheCoherenceLogs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    slot_id VARCHAR(10) NOT NULL,
    previous_state ENUM('Modified', 'Exclusive', 'Shared', 'Invalid') NOT NULL,
    new_state ENUM('Modified', 'Exclusive', 'Shared', 'Invalid') NOT NULL,
    action_type ENUM('BUS_READ', 'BUS_WRITE', 'INVALIDATE', 'WRITE_BACK') NOT NULL,
    initiating_core ENUM('CPU-1', 'CPU-2', 'CPU-3', 'CPU-4') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- SEED DATA: Insert Initial Users, Slots, and Sample Transactions
-- ---------------------------------------------------------------------
INSERT INTO Users (username, password_hash, full_name, role, email) VALUES
('admin', SHA2('admin123', 256), 'System Administrator', 'ADMIN', 'admin@smartparking.edu'),
('operator1', SHA2('operator123', 256), 'Entry Gate Operator', 'OPERATOR', 'gate1@smartparking.edu'),
('cap_prof', SHA2('cap2026', 256), 'Prof. Architecture Evaluator', 'PROFESSOR', 'eval@university.edu');

-- Sample Initial Slots (Zone A - Cars)
INSERT INTO ParkingSlots (slot_id, zone, slot_number, slot_type, status, floor, allocated_vehicle_reg) VALUES
('A-101', 'A', 101, 'Car', 'Occupied', 1, 'DL-01-CA-2001'),
('A-102', 'A', 102, 'Car', 'Available', 1, NULL),
('A-103', 'A', 103, 'Car', 'Occupied', 1, 'DL-01-CA-2003'),
('A-104', 'A', 104, 'Car', 'Available', 1, NULL),
('B-201', 'B', 201, 'SUV', 'Available', 1, NULL),
('B-202', 'B', 202, 'SUV', 'Occupied', 1, 'MH-02-SV-3102'),
('C-301', 'C', 301, 'Bike', 'Occupied', 1, 'KA-03-BK-1001'),
('C-302', 'C', 302, 'Bike', 'Available', 1, NULL),
('D-401', 'D', 401, 'EV', 'Available', 1, NULL),
('D-402', 'D', 402, 'EV', 'Occupied', 1, 'TN-07-EV-5002');
`;
