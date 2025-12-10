import React, { useState, useEffect, useRef } from 'react';
import { Bluetooth, Activity, ShieldAlert, Play, Square, Clock, BarChart, Laptop, RefreshCw, Search, XCircle, Link, Link2Off, HelpCircle } from 'lucide-react';
import { BluetoothDevice, ModoSState } from '../types';
import { scanBluetoothDevices, requestBrowserBluetoothDevice, isWebBluetoothSupported } from '../services/rfService';
import * as d3 from 'd3';

interface BluetoothViewProps {
  onModoSToggle: (active: boolean) => void;
  modoSState: ModoSState;
}

interface RssiHistory {
  time: number;
  rssi: number;
}

// Sub-component for the D3 Graph
const RssiGraph: React.FC<{ data: RssiHistory[], color?: string }> = ({ data, color = "#3b82f6" }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 600;
  const height = 150;
  const margin = { top: 10, right: 10, bottom: 20, left: 40 };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Gradient Definition
    const defs = svg.append("defs");
    const gradientId = `rssi-gradient-${color.replace('#', '')}`;
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.5);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale (Time) - Rolling 60s window
    const now = Date.now();
    const xScale = d3.scaleTime()
      .domain([now - 60000, now])
      .range([0, innerWidth]);

    // Y Scale (RSSI)
    const yScale = d3.scaleLinear()
      .domain([-100, -20]) // Typical RSSI range
      .range([innerHeight, 0]);

    // Grid Lines
    const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat((d) => `${d}`);
    g.append("g")
      .attr("class", "grid-lines opacity-20 text-slate-500 font-mono text-[8px]")
      .call(yAxis)
      .select(".domain").remove();

    // Style axis text
    g.selectAll(".tick text").attr("x", -10).attr("fill", "#64748b");
    g.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", -30)
     .attr("x", -innerHeight / 2)
     .attr("dy", "1em")
     .style("text-anchor", "middle")
     .style("fill", "#64748b")
     .style("font-size", "10px")
     .text("RSSI (dBm)");

    if (data.length > 1) {
        // Line Generator
        const line = d3.line<RssiHistory>()
          .curve(d3.curveMonotoneX)
          .x(d => xScale(d.time))
          .y(d => yScale(d.rssi));

        // Area Generator
        const area = d3.area<RssiHistory>()
          .curve(d3.curveMonotoneX)
          .x(d => xScale(d.time))
          .y0(innerHeight)
          .y1(d => yScale(d.rssi));

        // Draw Area
        g.append("path")
          .datum(data)
          .attr("fill", `url(#${gradientId})`)
          .attr("d", area);

        // Draw Line
        g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("d", line);
          
        // Current Value Dot
        const last = data[data.length - 1];
        g.append("circle")
           .attr("cx", xScale(last.time))
           .attr("cy", yScale(last.rssi))
           .attr("r", 4)
           .attr("fill", color)
           .attr("stroke", "#fff")
           .attr("stroke-width", 1.5);
    } else if (data.length === 0) {
        g.append("text")
         .attr("x", innerWidth / 2)
         .attr("y", innerHeight / 2)
         .attr("text-anchor", "middle")
         .attr("fill", "#475569")
         .text("Waiting for data...");
    }

  }, [data, color]);

  return (
    <div className="w-full h-40 bg-slate-900/50 rounded-lg border border-slate-700/50 relative overflow-hidden">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none" />
    </div>
  );
};

export const BluetoothView: React.FC<BluetoothViewProps> = ({ onModoSToggle, modoSState }) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [browserDevices, setBrowserDevices] = useState<BluetoothDevice[]>([]);
  const [windowTimer, setWindowTimer] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Tracking State
  const [selectedMac, setSelectedMac] = useState<string | null>(null);
  const [rssiHistory, setRssiHistory] = useState<RssiHistory[]>([]);

  // Poll for simulated/backend devices
  useEffect(() => {
    const fetchDevices = async () => {
       const scanned = await scanBluetoothDevices();
       // Add simulated jitter
       const withJitter = scanned.map(d => ({
         ...d,
         rssi: d.rssi + Math.floor(Math.random() * 6 - 3) 
       }));
       setDevices(withJitter);
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 1000); 
    return () => clearInterval(interval);
  }, []);

  // Browser Bluetooth Request Handler
  const handleBrowserScan = async () => {
    setErrorMsg(null);
    try {
      const device = await requestBrowserBluetoothDevice();
      if (device) {
        setBrowserDevices(prev => {
          // Prevent duplicates
          if (prev.some(d => d.mac === device.mac)) return prev;
          return [...prev, device];
        });
        // Auto select the new real device
        setSelectedMac(device.mac);
        setRssiHistory([]);
      }
    } catch (e: any) {
      if (e.message && e.message.includes('policy')) {
        setErrorMsg("Feature Blocked: Web Bluetooth is disabled in this environment (likely an iframe). Please run this on a Raspberry Pi or a standalone HTTPS window.");
      } else {
        setErrorMsg("Bluetooth Error: " + e.message);
      }
    }
  };

  // Merge lists (Backend + Browser)
  const allDevices = [...browserDevices, ...devices];

  // Filter devices based on search query
  const filteredDevices = allDevices.filter(dev => 
    (dev.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.mac.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update History for Selected Device
  useEffect(() => {
    if (allDevices.length === 0) return;

    let targetMac = selectedMac;
    if (!targetMac && allDevices.length > 0) {
      targetMac = allDevices[0].mac;
      setSelectedMac(targetMac);
    }

    const targetDevice = allDevices.find(d => d.mac === targetMac);
    
    if (targetDevice) {
      setRssiHistory(prev => {
        const now = Date.now();
        // Add new point (use device RSSI or mock variation for browser devices that don't update)
        const val = targetDevice.cod === 'Browser/BLE' ? -50 + Math.random() * 5 : targetDevice.rssi;
        
        const newHist = [...prev, { time: now, rssi: val }];
        return newHist.filter(h => h.time > now - 60000);
      });
    }
  }, [devices, selectedMac, browserDevices]); // Depend on devices update to trigger graph update

  // Window Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modoSState !== ModoSState.IDLE) {
       interval = setInterval(() => {
          setWindowTimer(prev => prev + 1);
       }, 1000);
    } else {
      setWindowTimer(0);
    }
    return () => clearInterval(interval);
  }, [modoSState]);

  const selectedDevice = allDevices.find(d => d.mac === selectedMac);
  const selectedDeviceName = selectedDevice?.name || 'Unknown';
  const isSelectedConnected = selectedDevice?.isConnected;
  const webBluetoothAvailable = isWebBluetoothSupported();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bluetooth className="text-blue-500 w-8 h-8" />
            Bluetooth Diagnostics
          </h2>
          <p className="text-slate-400 mt-1">Scanner and Vulnerability Assessment (Edu)</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
              <div className={`w-2 h-2 rounded-full ${modoSState === ModoSState.ACTIVE ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`}></div>
              <span className="text-xs font-mono text-slate-300">
                MONITOR MODE: {modoSState === ModoSState.IDLE ? 'PASSIVE' : 'ACTIVE INJECTION'}
              </span>
           </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg flex items-start justify-between gap-3 text-red-200 animate-in fade-in slide-in-from-top-2">
           <div className="flex gap-3">
             <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
             <div className="text-sm">
                <strong>Access Denied:</strong> {errorMsg}
             </div>
           </div>
           <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200"><XCircle className="w-5 h-5" /></button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Device List & Graph */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Device List */}
          <div className="bg-rf-panel border border-slate-700 rounded-xl overflow-hidden shadow-lg">
             <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-slate-200 flex items-center gap-2">
                     <Activity className="w-4 h-4 text-blue-400" />
                     Discovered Devices
                   </h3>
                   <span className="text-xs text-slate-500 font-mono px-2 py-0.5 bg-slate-900 rounded">{filteredDevices.length} VISIBLE</span>
                </div>
                
                {/* Browser Scan Button */}
                {webBluetoothAvailable ? (
                   <button 
                     onClick={handleBrowserScan}
                     className="flex items-center gap-2 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold uppercase transition-colors"
                   >
                     <Laptop className="w-3 h-3" />
                     Add via Browser
                   </button>
                ) : (
                  <span className="text-[10px] text-slate-600 cursor-help" title="Web Bluetooth API not supported in this browser">Browser Scan Unavailable</span>
                )}
             </div>

             {/* Search Bar */}
             <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                   <input 
                     type="text" 
                     placeholder="Filter by Name or MAC address..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-slate-900 text-sm text-white pl-9 pr-10 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                   />
                   {searchQuery && (
                     <button 
                       onClick={() => setSearchQuery('')}
                       className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition-colors"
                     >
                       <XCircle className="w-4 h-4" />
                     </button>
                   )}
                </div>
             </div>
             
             <div className="divide-y divide-slate-700/50 max-h-60 overflow-y-auto custom-scrollbar">
               {filteredDevices.map((dev) => (
                 <div 
                    key={dev.mac} 
                    onClick={() => {
                        setSelectedMac(dev.mac);
                        setRssiHistory([]); // Clear history on switch
                    }}
                    className={`p-4 transition-colors flex items-center justify-between group cursor-pointer border-l-4 ${selectedMac === dev.mac ? 'bg-slate-700/50 border-blue-500' : 'hover:bg-slate-700/30 border-transparent'}`}
                 >
                    <div className="flex items-center gap-4">
                       <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border ${selectedMac === dev.mac ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-800 border-slate-700'}`}>
                          <span className={`text-xs font-bold ${dev.rssi > -60 ? 'text-green-400' : 'text-yellow-500'}`}>
                            {dev.cod === 'Browser/BLE' ? '~' : dev.rssi}
                          </span>
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <div className={`font-bold text-sm ${selectedMac === dev.mac ? 'text-blue-200' : 'text-white'}`}>{dev.name || 'Unknown'}</div>
                             {dev.cod === 'Browser/BLE' && <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/30">BROWSER</span>}
                             
                             {/* List Item Connection Status */}
                             {dev.isConnected === true ? (
                               <div className="flex items-center text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20" title="Device Connected">
                                 <Link className="w-3 h-3 mr-1" />
                                 LINKED
                               </div>
                             ) : dev.isConnected === false ? (
                               <div className="flex items-center text-[10px] text-slate-500 bg-slate-700/30 px-1.5 py-0.5 rounded border border-slate-600/30" title="Device Disconnected">
                                 <Link2Off className="w-3 h-3 mr-1" />
                                 UNLINKED
                               </div>
                             ) : null}

                          </div>
                          <div className="flex gap-2 text-xs font-mono text-slate-400">
                             <span>{dev.mac}</span>
                             <span className="text-slate-600">|</span>
                             <span className="text-blue-300">{dev.cod}</span>
                          </div>
                       </div>
                    </div>
                    
                    {selectedMac === dev.mac && (
                        <div className="text-[10px] text-blue-400 font-bold animate-pulse">
                           TRACKING
                        </div>
                    )}
                 </div>
               ))}
               {filteredDevices.length === 0 && (
                 <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                   {searchQuery ? (
                     <>
                        <Search className="w-6 h-6 opacity-50" />
                        <span>No devices match "{searchQuery}"</span>
                     </>
                   ) : (
                     <>
                        <RefreshCw className="w-6 h-6 animate-spin opacity-50" />
                        <span>Scanning for devices...</span>
                     </>
                   )}
                 </div>
               )}
             </div>
          </div>

          {/* Live Graph */}
          <div className="bg-rf-panel border border-slate-700 rounded-xl overflow-hidden shadow-lg p-4">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm uppercase">
                    <BarChart className="w-4 h-4 text-rf-accent" />
                    Live Signal Tracker: <span className="text-white">{selectedDeviceName}</span>
                  </h3>
                  
                  {/* Detailed Connection Status Badge */}
                  {selectedDevice && (
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      isSelectedConnected === true
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : isSelectedConnected === false 
                          ? 'bg-slate-700/50 text-slate-400 border-slate-600'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {isSelectedConnected === true ? (
                        <>
                           <Link className="w-3 h-3" /> CONNECTED
                        </>
                      ) : isSelectedConnected === false ? (
                        <>
                           <Link2Off className="w-3 h-3" /> DISCONNECTED
                        </>
                      ) : (
                        <>
                            <HelpCircle className="w-3 h-3" /> STATUS UNKNOWN
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    LIVE FEED (1s)
                </div>
             </div>
             <RssiGraph data={rssiHistory} />
          </div>

        </div>

        {/* Right Column: Modo S Control Panel */}
        <div className="lg:col-span-1">
           <div className={`h-full border rounded-xl overflow-hidden shadow-lg transition-all ${modoSState !== ModoSState.IDLE ? 'border-red-500/50 bg-red-900/10' : 'border-slate-700 bg-rf-panel'}`}>
              <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                 <h3 className="font-bold text-white flex items-center gap-2">
                    <ShieldAlert className={modoSState !== ModoSState.IDLE ? 'text-red-500' : 'text-slate-400'} />
                    Modo S Controller
                 </h3>
              </div>

              <div className="p-6 flex flex-col items-center text-center space-y-6">
                 
                 {/* Status Display */}
                 <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center relative transition-colors duration-500
                    ${modoSState === ModoSState.ACTIVE ? 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 
                      modoSState === ModoSState.WINDOW ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 bg-slate-800'}`}>
                    
                    <div className="z-10 flex flex-col items-center">
                       {modoSState === ModoSState.ACTIVE && <Activity className="w-10 h-10 text-red-500 animate-pulse" />}
                       {modoSState === ModoSState.WINDOW && <Clock className="w-10 h-10 text-yellow-500 animate-bounce" />}
                       {modoSState === ModoSState.IDLE && <ShieldAlert className="w-10 h-10 text-slate-600" />}
                       
                       <span className="text-xs font-black mt-2 tracking-widest uppercase">
                          {modoSState}
                       </span>
                    </div>

                    {/* Spinning ring for active */}
                    {modoSState === ModoSState.ACTIVE && (
                       <div className="absolute inset-0 border-t-4 border-red-500 rounded-full animate-spin"></div>
                    )}
                 </div>

                 {/* Info Text */}
                 <div className="text-sm text-slate-300">
                    {modoSState === ModoSState.IDLE && (
                      <p>Exploits AFH (Adaptive Frequency Hopping) to assess streaming resilience. <br/><span className="text-xs text-slate-500">Requires jumper on GPIO25.</span></p>
                    )}
                    {modoSState === ModoSState.ACTIVE && (
                      <p className="text-red-300 font-mono animate-pulse">
                        INJECTING HOPPING SEQUENCE<br/>
                        CYCLE: {Math.floor(windowTimer % 60)}/60s
                      </p>
                    )}
                    {modoSState === ModoSState.WINDOW && (
                      <p className="text-yellow-300 font-mono">
                        SAFETY WINDOW OPEN<br/>
                        PAUSED FOR: {10 - (Math.floor(windowTimer % 70) - 60)}s
                      </p>
                    )}
                 </div>

                 {/* Main Toggle */}
                 <button
                    onClick={() => onModoSToggle(modoSState === ModoSState.IDLE)}
                    className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-all transform active:scale-95 flex items-center justify-center gap-2
                      ${modoSState !== ModoSState.IDLE 
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500' 
                        : 'bg-rf-accent hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}
                 >
                    {modoSState !== ModoSState.IDLE ? (
                      <><Square className="w-5 h-5 fill-current" /> DEACTIVATE</>
                    ) : (
                      <><Play className="w-5 h-5 fill-current" /> INIT MODO S</>
                    )}
                 </button>

                 <div className="text-[10px] text-slate-500 text-justify border-t border-slate-700 pt-4">
                    <strong className="text-rf-danger">WARNING:</strong> For educational and diagnostic use in controlled private environments only. Do not affect third-party devices. Adhere to local RF regulations.
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};