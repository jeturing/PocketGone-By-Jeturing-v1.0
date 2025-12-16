import React, { useState, useEffect, useCallback } from 'react';
import { SpectrumDisplay } from './components/SpectrumDisplay';
import { ControlPanel } from './components/ControlPanel';
import { LogsView } from './components/LogsView';
import { BluetoothView } from './components/BluetoothView';
import { WifiView } from './components/WifiView';
import { PentestView } from './components/PentestView';
import { EvilTwinView } from './components/EvilTwinView';
import { TerminalView } from './components/TerminalView';
import { Login } from './components/Login';
import { KpiDashboard } from './components/KpiDashboard';
import { RadioConfig, SpectrumPoint, SignalLog, AppTab, ModoSState, UserSession } from './types';
import { generateSpectrumData } from './services/rfService';
import { login, logout, getSession } from './services/authService';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, Radio, FileBarChart, Settings, Wifi, Search, Bluetooth, AlertTriangle, LogOut, Activity, Shield, Terminal, Globe } from 'lucide-react';

const INITIAL_CONFIG: RadioConfig = {
  centerFreq: 98.5, 
  sampleRate: 2.048,
  gain: 25,
  bandwidth: 2.0
};

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [config, setConfig] = useState<RadioConfig>(INITIAL_CONFIG);
  const [spectrumData, setSpectrumData] = useState<SpectrumPoint[]>([]);
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [isLive, setIsLive] = useState(true);
  
  const [modoSState, setModoSState] = useState<ModoSState>(ModoSState.IDLE);
  const [modoSStartTime, setModoSStartTime] = useState<number>(0);

  // Check Auth on Mount
  useEffect(() => {
    const s = getSession();
    if (s) setSession(s);
  }, []);

  const handleLogin = async (code: string) => {
    const s = await login(code);
    if (s) setSession(s);
    return !!s;
  };

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  // Modo S Logic
  useEffect(() => {
    if (modoSState === ModoSState.IDLE) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - modoSStartTime) / 1000;
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
      setConfig({ centerFreq: 2440, bandwidth: 80, gain: 40, sampleRate: 2.4 });
    } else {
      setModoSState(ModoSState.IDLE);
    }
  };

  // RF Simulation
  useEffect(() => {
    if (!isLive || !session) return;
    const interval = setInterval(() => {
      generateSpectrumData(config, 128, modoSState === ModoSState.ACTIVE).then(setSpectrumData);
    }, 50);
    return () => clearInterval(interval);
  }, [config, isLive, modoSState, session]);

  const handleCapture = useCallback(() => {
    if (spectrumData.length === 0) return;
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

  // If not authenticated, show Login
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

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
          <button onClick={() => setActiveTab(AppTab.DASHBOARD)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.DASHBOARD ? 'bg-rf-accent text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>

          <button onClick={() => setActiveTab(AppTab.SPECTRUM)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.SPECTRUM ? 'bg-rf-accent text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Activity size={20} /> RF Spectrum
          </button>
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Lab Modules</div>

          <button onClick={() => setActiveTab(AppTab.BLUETOOTH)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.BLUETOOTH ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-600/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Bluetooth size={20} /> Bluetooth Lab
            {modoSState !== ModoSState.IDLE && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
          </button>

          <button onClick={() => setActiveTab(AppTab.WIFI)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.WIFI ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-600/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Wifi size={20} /> WiFi Monitor
          </button>

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pentesting</div>

          <button onClick={() => setActiveTab(AppTab.PENTEST)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.PENTEST ? 'bg-red-600/20 text-red-400 font-bold border border-red-600/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Shield size={20} /> WiFi Attacks
          </button>

          <button onClick={() => setActiveTab(AppTab.EVIL_TWIN)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.EVIL_TWIN ? 'bg-orange-600/20 text-orange-400 font-bold border border-orange-600/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Globe size={20} /> Evil Twin
          </button>

          <button onClick={() => setActiveTab(AppTab.TERMINAL)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.TERMINAL ? 'bg-green-600/20 text-green-400 font-bold border border-green-600/50' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Terminal size={20} /> Terminal
          </button>

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Tools</div>

          <button onClick={() => setActiveTab(AppTab.LOGS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.LOGS ? 'bg-rf-accent text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileBarChart size={20} /> Signal Logs
          </button>
           <button onClick={() => setActiveTab(AppTab.SETTINGS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === AppTab.SETTINGS ? 'bg-rf-accent text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={20} /> System
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
             <div className="text-xs text-slate-500">
                User: <span className="text-white font-bold">{session.username}</span>
             </div>
             <button onClick={handleLogout} className="text-slate-500 hover:text-red-400"><LogOut size={16}/></button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
         {/* Mobile Header */}
         <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
            <h1 className="text-lg font-black text-white italic">PG<span className="text-rf-accent">EDU</span></h1>
            <button onClick={handleLogout}><LogOut size={20} className="text-slate-400" /></button>
         </header>

         {modoSState !== ModoSState.IDLE && (
            <div className="bg-red-500/20 border-b border-red-500/50 p-2 flex items-center justify-center gap-2 text-red-200 text-xs font-bold animate-pulse">
               <AlertTriangle size={14} /> WARNING: MODO S ACTIVE - INTERFERENCE GENERATION IN PROGRESS (2.4 GHz)
            </div>
         )}

         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#0b1120]">
            
            {activeTab === AppTab.DASHBOARD && <KpiDashboard />}

            {activeTab === AppTab.SPECTRUM && (
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Spectrum Analyzer</h2>
                    <p className="text-slate-400">Real-time FFT visualization of {config.centerFreq} MHz band.</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setIsLive(!isLive)} className={`px-3 py-1 rounded text-xs font-bold uppercase ${isLive ? 'bg-rf-danger/20 text-rf-danger border-rf-danger' : 'bg-green-500/20 text-green-500 border-green-500'} border`}>
                       {isLive ? 'Stop Scan' : 'Resume Scan'}
                     </button>
                  </div>
                </div>
                <SpectrumDisplay data={spectrumData} config={config} />
                <ControlPanel config={config} onChange={setConfig} onCapture={handleCapture} />
              </div>
            )}

            {activeTab === AppTab.BLUETOOTH && <BluetoothView onModoSToggle={toggleModoS} modoSState={modoSState} />}

            {activeTab === AppTab.WIFI && <WifiView />}

            {activeTab === AppTab.PENTEST && <PentestView />}

            {activeTab === AppTab.EVIL_TWIN && <EvilTwinView />}

            {activeTab === AppTab.TERMINAL && <TerminalView />}

            {activeTab === AppTab.LOGS && <LogsView logs={logs} onDelete={(id) => setLogs(p => p.filter(l => l.id !== id))} onUpdateLog={(id, u) => setLogs(p => p.map(l => l.id === id ? {...l, ...u} : l))} />}
            
            {activeTab === AppTab.SETTINGS && (
              <div className="max-w-2xl mx-auto">
                 <h2 className="text-2xl font-bold mb-6">System Configuration</h2>
                 <div className="bg-rf-panel border border-slate-700 rounded-lg p-6 space-y-6">
                    <div>
                       <label className="block text-sm font-bold mb-2">DB PATH</label>
                       <input disabled value="../data/pocketgone.db" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-500" />
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