import React, { useState, useEffect, useCallback } from 'react';
import { SpectrumDisplay } from './components/SpectrumDisplay';
import { ControlPanel } from './components/ControlPanel';
import { LogsView } from './components/LogsView';
import { BluetoothView } from './components/BluetoothView';
import { WifiView } from './components/WifiView';
import { RadioConfig, SpectrumPoint, SignalLog, AppTab, ModoSState } from './types';
import { generateSpectrumData } from './services/rfService';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, Radio, FileBarChart, Settings, Wifi, Search, Bluetooth, AlertTriangle } from 'lucide-react';

const INITIAL_CONFIG: RadioConfig = {
  centerFreq: 98.5, // FM Start
  sampleRate: 2.048,
  gain: 25,
  bandwidth: 2.0
};

const App: React.FC = () => {
  const [config, setConfig] = useState<RadioConfig>(INITIAL_CONFIG);
  const [spectrumData, setSpectrumData] = useState<SpectrumPoint[]>([]);
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [isLive, setIsLive] = useState(true);
  
  // Modo S State
  const [modoSState, setModoSState] = useState<ModoSState>(ModoSState.IDLE);
  const [modoSStartTime, setModoSStartTime] = useState<number>(0);

  // Logic for Modo S "Ventana" (Window) - 60s active, 10s pause
  useEffect(() => {
    if (modoSState === ModoSState.IDLE) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - modoSStartTime) / 1000;
      
      // Cycle is 70 seconds total (60 active + 10 pause)
      const cyclePos = elapsed % 70;

      if (cyclePos < 60) {
        if (modoSState !== ModoSState.ACTIVE) setModoSState(ModoSState.ACTIVE);
      } else {
        if (modoSState !== ModoSState.WINDOW) setModoSState(ModoSState.WINDOW);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [modoSState, modoSStartTime]);

  const toggleModoS = (active: boolean) => {
    if (active) {
      setModoSState(ModoSState.ACTIVE);
      setModoSStartTime(Date.now());
      // Auto-switch to 2.4GHz band for visual feedback
      setConfig({
        centerFreq: 2440,
        bandwidth: 80, // Wide view
        gain: 40,
        sampleRate: 2.4
      });
      // Ensure we go to spectrum if not already there, OR stay in BT view. 
      // Actually staying in BT view is better UX, but the Spectrum data runs in background.
    } else {
      setModoSState(ModoSState.IDLE);
    }
  };

  // Simulation Loop
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // If Modo S is active, we pass true to generate visual interference
      generateSpectrumData(config, 128, modoSState === ModoSState.ACTIVE).then((newData) => {
        setSpectrumData(newData);
      });
    }, 50); // 20 FPS roughly

    return () => clearInterval(interval);
  }, [config, isLive, modoSState]);

  const handleCapture = useCallback(() => {
    if (spectrumData.length === 0) return;

    // Find peak
    const peak = spectrumData.reduce((max, p) => p.db > max.db ? p : max, spectrumData[0]);

    const newLog: SignalLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      frequency: config.centerFreq,
      bandwidth: config.bandwidth,
      peakDb: peak.db,
      notes: "Manual capture from dashboard."
    };

    setLogs(prev => [newLog, ...prev]);
    setActiveTab(AppTab.LOGS);
  }, [spectrumData, config]);

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateLog = (id: string, updates: Partial<SignalLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  return (
    <div className="flex h-screen bg-rf-dark text-slate-200 font-sans selection:bg-rf-accent selection:text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex z-50">
        <div className="p-6">
           <h1 className="text-2xl font-black text-white tracking-tighter italic">
             POCKET<span className="text-rf-accent">GONE</span>
           </h1>
           <span className="text-xs text-slate-500 font-mono tracking-widest">EDU WEBLAB v1.0</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab(AppTab.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.DASHBOARD ? 'bg-rf-accent text-slate-900 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Lab Modules</div>

          <button 
            onClick={() => setActiveTab(AppTab.BLUETOOTH)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.BLUETOOTH ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-600/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Bluetooth size={20} />
            Bluetooth Lab
            {modoSState !== ModoSState.IDLE && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.WIFI)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.WIFI ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-600/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Wifi size={20} />
            WiFi Monitor
          </button>

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Tools</div>

          <button 
            onClick={() => setActiveTab(AppTab.LOGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.LOGS ? 'bg-rf-accent text-slate-900 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileBarChart size={20} />
            Signal Logs
            {logs.length > 0 && <span className="ml-auto bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full">{logs.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.ANALYSIS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.ANALYSIS ? 'bg-rf-accent text-slate-900 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Search size={20} />
            Band Scanner
          </button>
           <button 
            onClick={() => setActiveTab(AppTab.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.SETTINGS ? 'bg-rf-accent text-slate-900 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={20} />
            System
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                <Radio size={14} className="text-green-400" />
                <span>RTL-SDR: Ready</span>
              </div>
               <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                <Bluetooth size={14} className={modoSState !== ModoSState.IDLE ? "text-red-400 animate-pulse" : "text-slate-500"} />
                <span>BT Module: {modoSState !== ModoSState.IDLE ? 'INJECTION' : 'IDLE'}</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-rf-accent h-full w-[25%]"></div>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                 <span>RPI4 CPU</span>
                 <span>48°C</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
         
         {/* Mobile Header */}
         <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
            <h1 className="text-lg font-black text-white italic">
             PG<span className="text-rf-accent">EDU</span>
            </h1>
            <div className="flex gap-4">
               <button onClick={() => setActiveTab(AppTab.DASHBOARD)} className={activeTab === AppTab.DASHBOARD ? 'text-rf-accent' : 'text-slate-400'}><LayoutDashboard /></button>
               <button onClick={() => setActiveTab(AppTab.BLUETOOTH)} className={activeTab === AppTab.BLUETOOTH ? 'text-blue-400' : 'text-slate-400'}><Bluetooth /></button>
            </div>
         </header>

         {/* Alert Bar for Modo S */}
         {modoSState !== ModoSState.IDLE && (
            <div className="bg-red-500/20 border-b border-red-500/50 p-2 flex items-center justify-center gap-2 text-red-200 text-xs font-bold animate-pulse">
               <AlertTriangle size={14} />
               WARNING: MODO S ACTIVE - INTERFERENCE GENERATION IN PROGRESS (2.4 GHz)
            </div>
         )}

         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#0b1120]">
            
            {activeTab === AppTab.DASHBOARD && (
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Spectrum Analyzer</h2>
                    <p className="text-slate-400">Real-time FFT visualization of {config.centerFreq} MHz band.</p>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => setIsLive(!isLive)}
                       className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${isLive ? 'bg-rf-danger/20 text-rf-danger border border-rf-danger' : 'bg-green-500/20 text-green-500 border border-green-500'}`}
                     >
                       {isLive ? 'Stop Scan' : 'Resume Scan'}
                     </button>
                  </div>
                </div>

                {/* The Viz */}
                <SpectrumDisplay data={spectrumData} config={config} />

                {/* Controls */}
                <ControlPanel 
                  config={config} 
                  onChange={setConfig} 
                  onCapture={handleCapture}
                />
              </div>
            )}

            {activeTab === AppTab.BLUETOOTH && (
               <BluetoothView onModoSToggle={toggleModoS} modoSState={modoSState} />
            )}

            {activeTab === AppTab.WIFI && (
               <WifiView />
            )}

            {activeTab === AppTab.LOGS && (
               <div className="max-w-5xl mx-auto">
                 <h2 className="text-3xl font-bold text-white mb-6">Signal Library</h2>
                 <LogsView logs={logs} onDelete={handleDeleteLog} onUpdateLog={handleUpdateLog} />
               </div>
            )}

            {activeTab === AppTab.ANALYSIS && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                 <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
                    <Search className="w-10 h-10 text-rf-accent" />
                 </div>
                 <h2 className="text-2xl font-bold">Auto-Scanner Active</h2>
                 <p className="text-slate-400 max-w-md">The system is currently sweeping 400MHz - 900MHz looking for anomalies. Check back later or use Manual Mode in Dashboard.</p>
              </div>
            )}

             {activeTab === AppTab.SETTINGS && (
              <div className="max-w-2xl mx-auto">
                 <h2 className="text-2xl font-bold mb-6">System Configuration</h2>
                 <div className="bg-rf-panel border border-slate-700 rounded-lg p-6 space-y-6">
                    <div>
                       <label className="block text-sm font-bold mb-2">Device ID</label>
                       <input disabled value="RPI4-EDU-LAB-01" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-bold mb-2">Radio Interface</label>
                          <select className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white">
                             <option>RTL-SDR v3 (USB)</option>
                             <option>HackRF One (USB)</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-sm font-bold mb-2">Monitor Interface</label>
                          <select className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white">
                             <option>wlan1mon (Alfa AC-M)</option>
                             <option>wlan0 (Internal)</option>
                          </select>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-700">
                       <h3 className="text-slate-400 text-sm font-bold mb-2 uppercase">Safety Protocols</h3>
                       <div className="flex items-center gap-2 text-sm text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Thermal Throttling Active
                       </div>
                       <div className="flex items-center gap-2 text-sm text-green-400 mt-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Watchdog Timer Active
                       </div>
                    </div>
                 </div>
              </div>
            )}

         </div>
      </main>
    </div>
  );
};

export default App;