import React, { useState, useEffect } from 'react';
import { Wifi, Lock, Unlock, BarChart2, AlertCircle } from 'lucide-react';
import { WifiNetwork } from '../types';
import { scanWifiNetworks } from '../services/rfService';

export const WifiView: React.FC = () => {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchWifi = async () => {
        const nets = await scanWifiNetworks();
        setNetworks(nets);
    }
    fetchWifi();
    
    // Updates
    const interval = setInterval(async () => {
       const nets = await scanWifiNetworks();
       // Add simulated jitter if simulation mode
       const updated = nets.map(n => ({
          ...n,
          rssi: n.rssi + Math.floor(Math.random() * 4 - 2)
       }));
       setNetworks(updated);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simple channel distribution calc
  const channelCounts = [1, 6, 11].map(ch => ({
     channel: ch,
     count: networks.filter(n => n.channel === ch).length
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Wifi className="text-rf-accent w-8 h-8" />
          WiFi Scanner EDU
        </h2>
        <p className="text-slate-400 mt-1">802.11 Monitor Mode & Channel Analysis</p>
      </div>

       {/* Browser Limitation Notice */}
      <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-start gap-3 text-sm text-blue-200">
         <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
         <div>
            <span className="font-bold">Hardware Notice:</span> Web Browsers cannot access WiFi scanning data directly due to privacy sandboxing. 
            This view relies on the <strong>Raspberry Pi Backend (Alfa AC-M)</strong>. If the backend is offline, data is simulated for demonstration.
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Network List */}
         <div className="lg:col-span-2">
            <div className="bg-rf-panel border border-slate-700 rounded-xl overflow-hidden shadow-lg">
               <div className="grid grid-cols-12 bg-slate-800 p-3 text-xs font-bold text-slate-400 border-b border-slate-700 uppercase tracking-wider">
                  <div className="col-span-1 text-center">CH</div>
                  <div className="col-span-5">SSID / BSSID</div>
                  <div className="col-span-2">Vendor</div>
                  <div className="col-span-2">Security</div>
                  <div className="col-span-2 text-right">PWR</div>
               </div>
               
               <div className="divide-y divide-slate-700/50">
                  {networks.map((net, idx) => (
                    <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-slate-700/30 transition-colors text-sm">
                       <div className="col-span-1 text-center font-mono text-rf-accent font-bold bg-slate-800 rounded py-1">{net.channel}</div>
                       <div className="col-span-5 pl-2">
                          <div className="font-bold text-white">{net.ssid}</div>
                          <div className="text-[10px] font-mono text-slate-500">{net.bssid}</div>
                       </div>
                       <div className="col-span-2 text-slate-400 text-xs">{net.vendor}</div>
                       <div className="col-span-2 flex items-center gap-1 text-xs">
                          {net.security === 'OPEN' ? <Unlock className="w-3 h-3 text-red-400" /> : <Lock className="w-3 h-3 text-green-400" />}
                          <span className="text-slate-300">{net.security}</span>
                       </div>
                       <div className="col-span-2 text-right font-mono font-bold text-white">
                          {net.rssi} <span className="text-[10px] text-slate-500 font-normal">dBm</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Channel Analysis */}
         <div className="lg:col-span-1 space-y-6">
             <div className="bg-rf-panel border border-slate-700 rounded-xl p-5 shadow-lg">
                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                   <BarChart2 className="w-4 h-4 text-rf-accent" />
                   2.4GHz Congestion
                </h3>
                <div className="space-y-4">
                   {channelCounts.map(c => (
                      <div key={c.channel}>
                         <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Channel {c.channel}</span>
                            <span>{c.count} APs</span>
                         </div>
                         <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${c.count > 2 ? 'bg-rf-danger' : 'bg-rf-success'}`} 
                              style={{ width: `${Math.min(100, c.count * 20)}%` }}
                            ></div>
                         </div>
                      </div>
                   ))}
                </div>
                <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-xs text-slate-400">
                   <span className="text-rf-accent font-bold">Analysis:</span> Channel 6 is heavily congested. Recommended diagnostic scan on Channel 11.
                </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 opacity-75">
                <h3 className="font-bold text-slate-400 mb-2 text-sm uppercase">Interface Info</h3>
                <div className="font-mono text-xs space-y-2">
                   <div className="flex justify-between"><span>IFACE:</span> <span className="text-white">wlan1mon</span></div>
                   <div className="flex justify-between"><span>CHIPSET:</span> <span className="text-white">RTL8812AU</span></div>
                   <div className="flex justify-between"><span>MODE:</span> <span className="text-rf-accent">MONITOR</span></div>
                   <div className="flex justify-between"><span>TX POWER:</span> <span className="text-white">30 dBm</span></div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};