import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { VehicleEntry } from './pages/VehicleEntry';
import { VehicleExit } from './pages/VehicleExit';
import { SlotManagement } from './pages/SlotManagement';
import { BillingReceipts } from './pages/BillingReceipts';
import { Reports } from './pages/Reports';
import { CapProcessors } from './pages/CapProcessors';
import { PipelineSimulator } from './pages/PipelineSimulator';
import { MemoryCache } from './pages/MemoryCache';
import { SyncAndLocks } from './pages/SyncAndLocks';
import { PerformanceBenchmark } from './pages/PerformanceBenchmark';
import { DatabaseSchema } from './pages/DatabaseSchema';
import { CapDocs } from './pages/CapDocs';
import { Settings } from './pages/Settings';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<'ADMIN' | 'OPERATOR' | 'PROFESSOR'>('OPERATOR');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'vehicle-entry':
        return <VehicleEntry onNavigate={setCurrentTab} />;
      case 'vehicle-exit':
        return <VehicleExit onNavigate={setCurrentTab} />;
      case 'slot-management':
        return <SlotManagement onNavigate={setCurrentTab} />;
      case 'billing':
        return <BillingReceipts onNavigate={setCurrentTab} />;
      case 'reports':
        return <Reports onNavigate={setCurrentTab} />;
      case 'cap-processors':
        return <CapProcessors onNavigate={setCurrentTab} />;
      case 'pipeline':
        return <PipelineSimulator onNavigate={setCurrentTab} />;
      case 'memory-cache':
        return <MemoryCache onNavigate={setCurrentTab} />;
      case 'synchronization':
        return <SyncAndLocks onNavigate={setCurrentTab} />;
      case 'benchmark':
        return <PerformanceBenchmark onNavigate={setCurrentTab} />;
      case 'database-schema':
        return <DatabaseSchema onNavigate={setCurrentTab} />;
      case 'cap-docs':
        return <CapDocs onNavigate={setCurrentTab} />;
      case 'settings':
        return <Settings onNavigate={setCurrentTab} />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Responsive Mobile Drawer Toggle Button */}
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="fixed bottom-5 right-5 z-40 lg:hidden p-3.5 rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          aria-label="Toggle Navigation Menu"
        >
          {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
        />

        {/* Primary Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}
