import React, { useEffect, useState } from 'react';
import { KpiStats } from '../types';
import { getSystemStats } from '../services/rfService';
import { Activity, Shield, Wifi, HardDrive, Clock, Cpu, AlertTriangle } from 'lucide-react';

export const KpiDashboard: React.FC = () => {
  const [stats, setStats] = useState<KpiStats | null>(null);

  useEffect(() => {
    getSystemStats().then(setStats);
    const interval = setInterval(() => getSystemStats().then(setStats), 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="p-10 text-center animate-pulse">Loading Telemetry...</div>;

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Mission Control</h2>
        <p className="text-slate-400">System Telemetry & Threat Analysis</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 border-l-4 border-l-rf-accent backdrop-blur">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-slate-400 text-xs font-bold uppercase">System Uptime</p>
                 <h3 className="text-2xl font-mono text-white mt-1">{formatUptime(stats.uptimeSeconds)}</h3>
              </div>
              <Clock className="text-rf-accent opacity-50" />
           </div>
           <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
             <div className="bg-rf-accent h-full w-full animate-pulse"></div>
           </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 border-l-4 border-l-green-500 backdrop-blur">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-slate-400 text-xs font-bold uppercase">Packets Analyzed</p>
                 <h3 className="text-2xl font-mono text-white mt-1">{(stats.packetsCaptured / 1000).toFixed(1)}k</h3>
              </div>
              <Activity className="text-green-500 opacity-50" />
           </div>
           <div className="text-xs text-green-400 font-mono">+124/sec</div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 border-l-4 border-l-rf-danger backdrop-blur">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-slate-400 text-xs font-bold uppercase">Threats Mitigated</p>
                 <h3 className="text-2xl font-mono text-white mt-1">{stats.threatsBlocked}</h3>
              </div>
              <Shield className="text-rf-danger opacity-50" />
           </div>
           <div className="text-xs text-slate-400">Last: Deauth Attack (2m ago)</div>
        </div>

         <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 border-l-4 border-l-blue-500 backdrop-blur">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-slate-400 text-xs font-bold uppercase">Active Targets</p>
                 <h3 className="text-2xl font-mono text-white mt-1">{stats.activeDevices}</h3>
              </div>
              <Wifi className="text-blue-500 opacity-50" />
           </div>
           <div className="flex gap-2">
              <span className="text-[10px] bg-blue-900 text-blue-300 px-1 rounded">2.4G</span>
              <span className="text-[10px] bg-indigo-900 text-indigo-300 px-1 rounded">5G</span>
           </div>
        </div>
      </div>

      {/* Hardware Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-rf-panel border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
               <Cpu className="w-5 h-5 text-slate-400" /> Hardware Status
            </h3>
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                     <span>CPU LOAD (RPI 4)</span>
                     <span className={stats.cpuTemp > 60 ? 'text-orange-400' : 'text-green-400'}>{stats.cpuTemp}°C</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                     <div className="bg-gradient-to-r from-green-500 to-orange-500 h-full" style={{width: '34%'}}></div>
                  </div>
               </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                     <span>STORAGE (/data)</span>
                     <span>{stats.storageUsagePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                     <div className="bg-slate-600 h-full" style={{width: `${stats.storageUsagePercent}%`}}></div>
                  </div>
               </div>
            </div>
         </div>

         {/* Alerts */}
         <div className="bg-rf-panel border border-slate-700 rounded-xl p-6">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-yellow-500" /> Recent Alerts
            </h3>
            <div className="space-y-4">
               <div className="flex gap-3 items-start p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                  <div>
                     <div className="text-xs text-slate-500 font-mono mb-1">10:42:05 AM</div>
                     <div className="text-sm text-slate-200">Deauthentication frames detected on Channel 6</div>
                  </div>
               </div>
               <div className="flex gap-3 items-start p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 flex-shrink-0"></div>
                  <div>
                     <div className="text-xs text-slate-500 font-mono mb-1">10:30:00 AM</div>
                     <div className="text-sm text-slate-200">New Unknown Device: MAC 44:22:11:XX</div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};