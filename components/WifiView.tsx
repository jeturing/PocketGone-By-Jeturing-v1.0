import React, { useState, useEffect } from 'react';
import { Wifi, Lock, Unlock, BarChart2, AlertCircle, Layers } from 'lucide-react';
import { WifiNetwork, WifiBand } from '../types';
import { scanWifiNetworks } from '../services/rfService';

export const WifiView: React.FC = () => {
  const [activeBand, setActiveBand] = useState<WifiBand>('2.4GHz');
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWifi = async () => {
        setLoading(true);
        const nets = await scanWifiNetworks(activeBand);
        setNetworks(nets);
        setLoading(false);
    }
    fetchWifi();
    
    const interval = setInterval(async () => {
       const nets = await scanWifiNetworks(activeBand);
       const updated = nets.map(n => ({
          ...n,
          rssi: n.rssi + Math.floor(Math.random() * 4 - 2)
       }));
       setNetworks(updated);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBand]);

  const sortedNetworks = [...networks].sort((a,b) => b.rssi - a.rssi);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wifi className="text-rf-accent w-8 h-8" />
            WiFi Lab
          </h2>
          <p className="text-slate-400 mt-1">Multi-Band Monitor & Packet Analysis</p>
        </div>
        
        {/* Band Selector Tabs */}
        <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
           {(['2.4GHz', '5GHz', '6GHz'] as WifiBand[]).map(band => (
              <button
                key={band}
                onClick={() => setActiveBand(band)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeBand === band ? 'bg-rf-accent text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {band}
              </button>
           ))}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-start gap-3 text-sm text-blue-200">
         <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
         <div>
            <span className="font-bold">Hardware Notice:</span> Scanning {activeBand} band using Monitor Interface <strong>wlan1mon</strong>.
         </div>
      </div>

      <div className="bg-rf-panel border border-slate-700 rounded-xl overflow-hidden shadow-lg">
         <div className="grid grid-cols-12 bg-slate-800 p-3 text-xs font-bold text-slate-400 border-b border-slate-700 uppercase tracking-wider">
            <div className="col-span-1 text-center">CH</div>
            <div className="col-span-5">SSID / BSSID</div>
            <div className="col-span-2">Vendor</div>
            <div className="col-span-2">Security</div>
            <div className="col-span-2 text-right">Signal</div>
         </div>
         
         <div className="divide-y divide-slate-700/50 min-h-[300px]">
            {loading && networks.length === 0 ? (
               <div className="p-10 text-center text-slate-500">Scanning {activeBand} spectrum...</div>
            ) : sortedNetworks.map((net, idx) => (
              <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-slate-700/30 transition-colors text-sm group">
                 <div className="col-span-1 text-center">
                    <span className="font-mono text-rf-accent font-bold bg-slate-800 rounded px-2 py-1">{net.channel}</span>
                 </div>
                 <div className="col-span-5 pl-2">
                    <div className="font-bold text-white flex items-center gap-2">
                        {net.ssid}
                        {net.width && <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded">{net.width}MHz</span>}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 group-hover:text-blue-300 transition-colors">{net.bssid}</div>
                 </div>
                 <div className="col-span-2 text-slate-400 text-xs">{net.vendor}</div>
                 <div className="col-span-2 flex items-center gap-1 text-xs">
                    {net.security.includes('OPEN') ? <Unlock className="w-3 h-3 text-red-400" /> : <Lock className="w-3 h-3 text-green-400" />}
                    <span className="text-slate-300">{net.security}</span>
                 </div>
                 <div className="col-span-2 text-right">
                     <div className="flex items-center justify-end gap-2">
                         <span className="font-mono font-bold text-white">{net.rssi}</span>
                         <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                             <div className={`h-full ${net.rssi > -60 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, (net.rssi + 100) * 1.5)}%` }}></div>
                         </div>
                     </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};