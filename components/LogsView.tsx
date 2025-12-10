import React from 'react';
import { SignalLog } from '../types';
import { FileText, Trash2, Radio } from 'lucide-react';

interface LogsViewProps {
  logs: SignalLog[];
  onDelete: (id: string) => void;
  onUpdateLog: (id: string, updates: Partial<SignalLog>) => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onDelete }) => {

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p>No signal logs captured yet.</p>
        <p className="text-sm">Use the Dashboard to capture a frequency.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {logs.map((log) => (
        <div key={log.id} className="bg-rf-panel border border-slate-700 rounded-xl overflow-hidden shadow-lg transition-all hover:border-rf-accent/50">
          <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-rf-accent/20 p-2 rounded-full text-rf-accent">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="font-mono font-bold text-white text-lg leading-none">
                   {log.frequency.toFixed(3)} <span className="text-rf-accent text-xs">MHz</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <button 
              onClick={() => onDelete(log.id)}
              className="text-slate-500 hover:text-rf-danger transition-colors p-2 hover:bg-slate-700 rounded-lg"
              title="Delete Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Tech Specs */}
             <div className="col-span-1 space-y-6">
               <div>
                  <h4 className="text-slate-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                    Signal Strength
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-mono text-white">{log.peakDb.toFixed(1)}</div>
                    <span className="text-sm text-slate-500 font-mono">dBFS</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 mt-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-rf-accent h-full transition-all" style={{ width: `${Math.min(100, (log.peakDb + 100))}%` }}></div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1">Bandwidth</h4>
                    <div className="text-white font-mono">{log.bandwidth} MHz</div>
                 </div>
                 <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1">Status</h4>
                    <div className="text-green-400 font-mono text-sm">CAPTURED</div>
                 </div>
               </div>
             </div>

             {/* User Notes */}
             <div className="col-span-1 flex flex-col h-full">
                <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Operator Notes</h4>
                <div className="bg-slate-900/50 flex-1 rounded-lg p-4 border border-slate-700/50">
                   <p className="text-slate-300 font-mono text-sm whitespace-pre-wrap">{log.notes || "No notes recorded."}</p>
                </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};