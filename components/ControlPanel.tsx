import React from 'react';
import { RadioConfig } from '../types';
import { Radio, Activity, Zap, Mic2 } from 'lucide-react';

interface ControlPanelProps {
  config: RadioConfig;
  onChange: (newConfig: RadioConfig) => void;
  onCapture: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ config, onChange, onCapture }) => {
  
  const handleChange = (key: keyof RadioConfig, value: number) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="bg-rf-panel p-6 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex items-center gap-2 mb-6 text-rf-accent">
        <Radio className="w-5 h-5" />
        <h2 className="text-lg font-bold uppercase tracking-wider">Radio Control</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Frequency Control */}
        <div className="col-span-2">
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2">
            Center Frequency (MHz)
          </label>
          <div className="flex gap-2">
             <input
              type="number"
              value={config.centerFreq}
              onChange={(e) => handleChange('centerFreq', parseFloat(e.target.value))}
              className="bg-slate-900 text-white text-2xl font-mono p-3 rounded-lg border border-slate-600 focus:border-rf-accent focus:outline-none w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
              step="0.1"
            />
            <div className="flex flex-col gap-1">
                <button onClick={() => handleChange('centerFreq', config.centerFreq + 1)} className="bg-slate-700 hover:bg-slate-600 px-3 rounded text-xs h-full">+</button>
                <button onClick={() => handleChange('centerFreq', config.centerFreq - 1)} className="bg-slate-700 hover:bg-slate-600 px-3 rounded text-xs h-full">-</button>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {[98.5, 433.92, 915.0, 2412].map(freq => (
              <button 
                key={freq}
                onClick={() => handleChange('centerFreq', freq)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
              >
                {freq}M
              </button>
            ))}
          </div>
        </div>

        {/* Gain Control */}
        <div>
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2 flex justify-between">
            <span>RF Gain</span>
            <span className="text-rf-accent">{config.gain} dB</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={config.gain}
            onChange={(e) => handleChange('gain', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rf-accent"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0dB</span>
            <span>25dB</span>
            <span>50dB</span>
          </div>
        </div>

        {/* Bandwidth Control */}
        <div>
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2 flex justify-between">
            <span>Sample Rate / BW</span>
            <span className="text-rf-accent">{config.bandwidth} MHz</span>
          </label>
           <select 
             value={config.bandwidth}
             onChange={(e) => handleChange('bandwidth', parseFloat(e.target.value))}
             className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-rf-accent focus:border-rf-accent block p-2.5"
           >
             <option value={1.0}>1.0 MHz</option>
             <option value={2.0}>2.0 MHz</option>
             <option value={2.4}>2.4 MHz (Max)</option>
           </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-slate-400 text-xs">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 RTL-SDR: CONNECTED
             </div>
             <div className="flex items-center gap-2 text-slate-400 text-xs">
                 <Activity className="w-3 h-3" />
                 CPU: 12%
             </div>
         </div>

         <button 
           onClick={onCapture}
           className="bg-rf-accent hover:bg-cyan-500 text-slate-900 font-bold py-2 px-6 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
         >
           <Zap className="w-4 h-4" />
           CAPTURE SIGNAL
         </button>
      </div>
    </div>
  );
};