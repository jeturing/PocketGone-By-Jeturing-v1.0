import React, { useState, useEffect } from 'react';
import { Radio, Globe, Users, Key, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export const EvilTwinView: React.FC = () => {
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [ssid, setSsid] = useState('');
  const [channel, setChannel] = useState('6');
  const [portalType, setPortalType] = useState<'google' | 'facebook' | 'generic'>('google');
  const [targetMac, setTargetMac] = useState('');
  const [activeAPs, setActiveAPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [selectedAPId, setSelectedAPId] = useState<string | null>(null);

  useEffect(() => {
    loadInterfaces();
    const interval = setInterval(loadActiveAPs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAPId) {
      loadCredentials(selectedAPId);
      const interval = setInterval(() => loadCredentials(selectedAPId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedAPId]);

  const loadInterfaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pentest/tools`);
      const data = await res.json();
      setInterfaces(data.interfaces || []);
      if (data.interfaces && data.interfaces.length > 0) {
        setSelectedInterface(data.interfaces[0].name);
      }
    } catch (err) {
      console.error('Failed to load interfaces:', err);
    }
  };

  const loadActiveAPs = async () => {
    // In a real implementation, we'd fetch active APs from the backend
    // For now, we'll use state management
  };

  const loadCredentials = async (apId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/captive-portal/${apId}/credentials`);
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    }
  };

  const createEvilTwin = async () => {
    if (!ssid || !selectedInterface) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/evil-twin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interface: selectedInterface,
          ssid,
          channel: parseInt(channel),
          target_mac: targetMac || null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setActiveAPs([...activeAPs, {
          ap_id: data.ap_id,
          ssid,
          type: 'evil_twin',
          channel,
          interface: selectedInterface
        }]);
        alert(`Evil Twin AP created: ${ssid}`);
      } else {
        alert('Failed to create Evil Twin AP');
      }
    } catch (err) {
      alert(`Error: ${err}`);
    }
    setLoading(false);
  };

  const createCaptivePortal = async () => {
    if (!ssid || !selectedInterface) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/captive-portal/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interface: selectedInterface,
          ssid,
          channel: parseInt(channel),
          portal_type: portalType
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const newAP = {
          ap_id: data.ap_id,
          ssid,
          type: 'captive_portal',
          portal_type: portalType,
          channel,
          interface: selectedInterface
        };
        setActiveAPs([...activeAPs, newAP]);
        setSelectedAPId(data.ap_id);
        alert(`Captive Portal created: ${ssid}`);
      } else {
        alert('Failed to create Captive Portal');
      }
    } catch (err) {
      alert(`Error: ${err}`);
    }
    setLoading(false);
  };

  const stopAP = async (apId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/evil-twin/${apId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setActiveAPs(activeAPs.filter(ap => ap.ap_id !== apId));
        if (selectedAPId === apId) {
          setSelectedAPId(null);
          setCredentials([]);
        }
        alert('AP stopped successfully');
      } else {
        alert('Failed to stop AP');
      }
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Evil Twin & Captive Portal</h2>
          <p className="text-slate-400">Create rogue access points for security testing</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <AlertTriangle className="text-red-400" size={20} />
          <span className="text-red-200 text-sm font-bold">Ethical Use Only</span>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evil Twin Creation */}
        <div className="bg-rf-panel border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Radio size={20} className="text-rf-accent" />
            Create Evil Twin AP
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Interface</label>
              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              >
                {interfaces.map(iface => (
                  <option key={iface.name} value={iface.name}>
                    {iface.name} - {iface.mac}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">SSID (Network Name)</label>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="Free WiFi"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  {[1, 6, 11].map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Target MAC (opt.)</label>
                <input
                  type="text"
                  value={targetMac}
                  onChange={(e) => setTargetMac(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={createEvilTwin}
              disabled={loading || !ssid || !selectedInterface}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Radio size={20} />}
              Create Evil Twin
            </button>
          </div>
        </div>

        {/* Captive Portal Creation */}
        <div className="bg-rf-panel border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Globe size={20} className="text-rf-accent" />
            Create Captive Portal
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Interface</label>
              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              >
                {interfaces.map(iface => (
                  <option key={iface.name} value={iface.name}>
                    {iface.name} - {iface.mac}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">SSID (Network Name)</label>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="Airport WiFi"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              >
                {[1, 6, 11].map(ch => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Portal Template</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPortalType('google')}
                  className={`p-3 rounded border-2 transition-all ${
                    portalType === 'google'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-white font-bold text-sm">Google</div>
                </button>
                <button
                  onClick={() => setPortalType('facebook')}
                  className={`p-3 rounded border-2 transition-all ${
                    portalType === 'facebook'
                      ? 'border-blue-600 bg-blue-600/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-white font-bold text-sm">Facebook</div>
                </button>
                <button
                  onClick={() => setPortalType('generic')}
                  className={`p-3 rounded border-2 transition-all ${
                    portalType === 'generic'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-white font-bold text-sm">Generic</div>
                </button>
              </div>
            </div>

            <button
              onClick={createCaptivePortal}
              disabled={loading || !ssid || !selectedInterface}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
              Create Captive Portal
            </button>
          </div>
        </div>
      </div>

      {/* Active APs */}
      {activeAPs.length > 0 && (
        <div className="bg-rf-panel border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-400" />
            Active Access Points
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAPs.map((ap) => (
              <div key={ap.ap_id} className="p-4 bg-slate-800 rounded-lg border-2 border-green-500/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-bold text-lg">{ap.ssid}</h4>
                    <p className="text-slate-400 text-sm">
                      {ap.type === 'captive_portal' ? `Captive Portal (${ap.portal_type})` : 'Evil Twin'}
                    </p>
                  </div>
                  <button
                    onClick={() => stopAP(ap.ap_id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-300">Interface: <span className="font-mono">{ap.interface}</span></p>
                  <p className="text-slate-300">Channel: {ap.channel}</p>
                  <p className="text-slate-300">ID: <span className="font-mono text-xs">{ap.ap_id}</span></p>
                </div>
                {ap.type === 'captive_portal' && (
                  <button
                    onClick={() => setSelectedAPId(ap.ap_id)}
                    className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold"
                  >
                    View Credentials
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Captured Credentials */}
      {selectedAPId && credentials.length > 0 && (
        <div className="bg-rf-panel border border-red-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Key size={20} className="text-red-400" />
            Captured Credentials
            <span className="ml-auto text-sm bg-red-600/20 px-3 py-1 rounded text-red-300">
              {credentials.length} captured
            </span>
          </h3>
          <div className="bg-slate-900 rounded p-4 max-h-96 overflow-y-auto font-mono text-sm">
            {credentials.map((cred, idx) => (
              <div key={idx} className="mb-2 pb-2 border-b border-slate-700 text-slate-300">
                {cred}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-200 text-sm">
            <strong>⚠️ Warning:</strong> Captured credentials are for educational and authorized testing purposes only.
            Misuse is illegal and unethical.
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-300 mb-2">How It Works</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Evil Twin:</strong> Creates a rogue AP that mimics a legitimate network to intercept traffic</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Captive Portal:</strong> Adds a login page that captures credentials before allowing access</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Templates:</strong> Choose from Google, Facebook, or generic login pages for realistic phishing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-1">⚠</span>
            <span><strong>Legal Notice:</strong> Only use on networks you own or have explicit authorization to test</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
