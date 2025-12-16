import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Trash2, Play, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
  timestamp: Date;
}

export const TerminalView: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = (text: string, type: 'input' | 'output' | 'error' | 'success' = 'output') => {
    setLines(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    addLine(`$ ${cmd}`, 'input');
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setCurrentCommand('');
    setExecuting(true);

    try {
      const res = await fetch(`${API_URL}/api/terminal/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          user: 'root',
          timeout: 30
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.stdout) {
          addLine(data.stdout.trim(), 'output');
        }
        if (data.stderr) {
          addLine(data.stderr.trim(), 'error');
        }
        if (data.success) {
          addLine(`✓ Command completed (exit code: ${data.returncode})`, 'success');
        } else {
          addLine(`✗ Command failed (exit code: ${data.returncode})`, 'error');
        }
      } else {
        addLine('Failed to execute command', 'error');
      }
    } catch (err) {
      addLine(`Error: ${err}`, 'error');
    }

    setExecuting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const clearTerminal = () => {
    setLines([]);
    addLine('Terminal cleared', 'success');
  };

  const runQuickCommand = (cmd: string) => {
    setCurrentCommand(cmd);
    executeCommand(cmd);
  };

  const quickCommands = [
    { label: 'List WiFi Interfaces', cmd: 'iwconfig' },
    { label: 'Network Interfaces', cmd: 'ip addr show' },
    { label: 'Check Monitor Mode', cmd: 'iwconfig | grep Mode' },
    { label: 'List Processes', cmd: 'ps aux | grep -E "airodump|wifite|reaver"' },
    { label: 'Disk Usage', cmd: 'df -h' },
    { label: 'System Info', cmd: 'uname -a' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Interactive Terminal</h2>
          <p className="text-slate-400">Execute commands with root privileges</p>
        </div>
        <button
          onClick={clearTerminal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-all"
        >
          <Trash2 size={18} />
          Clear
        </button>
      </div>

      {/* Quick Commands */}
      <div className="bg-rf-panel border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">Quick Commands</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickCommands.map((qc, idx) => (
            <button
              key={idx}
              onClick={() => runQuickCommand(qc.cmd)}
              disabled={executing}
              className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} className="text-rf-accent flex-shrink-0" />
              <div>
                <div className="text-white font-bold text-sm">{qc.label}</div>
                <div className="text-slate-400 text-xs font-mono">{qc.cmd}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-rf-panel border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
          <Terminal size={18} className="text-rf-accent" />
          <span className="text-white font-bold">Root Terminal</span>
          <span className="text-slate-400 text-sm ml-auto">root@pocketgone</span>
        </div>
        
        <div className="bg-slate-950 p-4 h-[500px] overflow-y-auto font-mono text-sm">
          {lines.length === 0 && (
            <div className="text-slate-500 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p>Welcome to PocketGone Interactive Terminal</p>
                <p className="mt-2">Type commands below or use Quick Commands above.</p>
                <p className="mt-1 text-xs">Use ↑/↓ arrows to navigate command history</p>
              </div>
            </div>
          )}
          
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={`mb-1 ${
                line.type === 'input' ? 'text-rf-accent font-bold' :
                line.type === 'success' ? 'text-green-400' :
                line.type === 'error' ? 'text-red-400' :
                'text-slate-300'
              }`}
            >
              {line.type === 'input' && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 text-xs">
                    {line.timestamp.toLocaleTimeString()}
                  </span>
                  <span>{line.text}</span>
                </div>
              )}
              {line.type !== 'input' && (
                <div className="whitespace-pre-wrap break-all">{line.text}</div>
              )}
            </div>
          ))}
          
          {executing && (
            <div className="text-yellow-400 flex items-center gap-2">
              <div className="animate-pulse">Executing...</div>
            </div>
          )}
          
          <div ref={outputEndRef} />
        </div>

        {/* Command Input */}
        <div className="bg-slate-900 px-4 py-3 border-t border-slate-700 flex items-center gap-3">
          <span className="text-rf-accent font-bold">root@pocketgone:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={executing}
            placeholder="Enter command..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-rf-accent disabled:opacity-50"
          />
          <button
            onClick={() => executeCommand(currentCommand)}
            disabled={executing || !currentCommand.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-rf-accent hover:bg-rf-accent/80 text-slate-900 rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            Execute
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-slate-300 space-y-2">
            <p>
              <strong className="text-blue-300">Root Access:</strong> Commands execute with root privileges on the system.
            </p>
            <p>
              <strong className="text-blue-300">Common Commands:</strong> iwconfig, ip, airmon-ng, airodump-ng, ps, top, ifconfig
            </p>
            <p>
              <strong className="text-yellow-300">Warning:</strong> Be careful with commands that modify system configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
