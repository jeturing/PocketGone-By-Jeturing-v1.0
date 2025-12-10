import React, { useState } from 'react';
import { Lock, Cpu, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (code: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const success = await onLogin(code);
    if (!success) {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rf-dark flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Matrix Effect Simulation */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #06b6d4 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10">
        <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4 border border-slate-700">
              <Cpu className="w-8 h-8 text-rf-accent animate-pulse" />
           </div>
           <h1 className="text-3xl font-black text-white italic tracking-tighter">
             POCKET<span className="text-rf-accent">GONE</span>
           </h1>
           <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-2">Edu Weblab Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Access Code</label>
            <div className="relative">
               <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
               <input 
                 type="password" 
                 value={code}
                 onChange={(e) => setCode(e.target.value)}
                 className="w-full bg-slate-800 border-2 border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:border-rf-accent focus:outline-none focus:ring-1 focus:ring-rf-accent transition-all font-mono tracking-widest"
                 placeholder="••••••••"
                 autoFocus
               />
            </div>
            {error && <p className="text-rf-danger text-xs mt-2 font-bold animate-pulse">ACCESS DENIED: INVALID CREDENTIALS</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-rf-accent hover:bg-cyan-400 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"></span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                INITIALIZE SESSION
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-600 font-mono">
            AUTHORIZED PERSONNEL ONLY. SYSTEM ACTIVITIES LOGGED.<br/>
            (Try code: 'admin' or 'student')
          </p>
        </div>
      </div>
    </div>
  );
};