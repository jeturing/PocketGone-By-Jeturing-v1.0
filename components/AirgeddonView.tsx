import React, { useState, useEffect } from 'react';
import { Shield, Wifi, Target, Key, Zap, AlertTriangle, Radio, Globe, Activity, CheckCircle2, XCircle, Loader2, Play, Square, Eye } from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface AirgeddonAttack {
  id: string;
  name: string;
  description: string;
  category: 'dos' | 'handshake' | 'wps' | 'evil_twin' | 'decrypt';
  icon: React.ReactNode;
  color: string;
  requiresTarget: boolean;
}

export const AirgeddonView: React.FC = () => {
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [attackOutput, setAttackOutput] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attackProgress, setAttackProgress] = useState(0);
  const [monitorMode, setMonitorMode] = useState(false);

  // Airgeddon attack options
  const attacks: AirgeddonAttack[] = [
    {
      id: 'dos_deauth',
      name: 'Deauth Attack',
      description: 'Desautenticación masiva - desconecta todos los clientes del AP',
      category: 'dos',
      icon: <Wifi className="w-8 h-8" />,
      color: 'bg-red-600',
      requiresTarget: true
    },
    {
      id: 'dos_beacon_flood',
      name: 'Beacon Flood',
      description: 'Inunda el aire con APs falsos - ataque DoS por saturación',
      category: 'dos',
      icon: <Radio className="w-8 h-8" />,
      color: 'bg-orange-600',
      requiresTarget: false
    },
    {
      id: 'dos_auth_flood',
      name: 'Auth/Assoc Flood',
      description: 'Sobrecarga el AP con peticiones de autenticación',
      category: 'dos',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-yellow-600',
      requiresTarget: true
    },
    {
      id: 'handshake_capture',
      name: 'Captura Handshake',
      description: 'Captura handshake WPA/WPA2 para crackeo offline',
      category: 'handshake',
      icon: <Key className="w-8 h-8" />,
      color: 'bg-blue-600',
      requiresTarget: true
    },
    {
      id: 'handshake_deauth',
      name: 'Handshake + Deauth',
      description: 'Captura handshake forzando desconexión de clientes',
      category: 'handshake',
      icon: <Target className="w-8 h-8" />,
      color: 'bg-cyan-600',
      requiresTarget: true
    },
    {
      id: 'wps_pixie_dust',
      name: 'WPS Pixie Dust',
      description: 'Ataque WPS Pixie Dust - explota vulnerabilidad del chip',
      category: 'wps',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-purple-600',
      requiresTarget: true
    },
    {
      id: 'wps_bruteforce',
      name: 'WPS Bruteforce',
      description: 'Fuerza bruta del PIN WPS - método lento pero efectivo',
      category: 'wps',
      icon: <Activity className="w-8 h-8" />,
      color: 'bg-pink-600',
      requiresTarget: true
    },
    {
      id: 'evil_twin_open',
      name: 'Evil Twin (Open)',
      description: 'AP gemelo malicioso sin contraseña - captura tráfico',
      category: 'evil_twin',
      icon: <Globe className="w-8 h-8" />,
      color: 'bg-indigo-600',
      requiresTarget: true
    },
    {
      id: 'evil_twin_captive',
      name: 'Evil Twin + Portal',
      description: 'AP gemelo con portal cautivo - captura credenciales',
      category: 'evil_twin',
      icon: <Shield className="w-8 h-8" />,
      color: 'bg-teal-600',
      requiresTarget: true
    },
    {
      id: 'decrypt_handshake',
      name: 'Decrypt Handshake',
      description: 'Descifra handshake capturado usando diccionario',
      category: 'decrypt',
      icon: <Key className="w-8 h-8" />,
      color: 'bg-green-600',
      requiresTarget: false
    }
  ];

  useEffect(() => {
    loadInterfaces();
  }, []);

  const loadInterfaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pentest/tools`);
      const data = await res.json();
      setInterfaces(data.interfaces || []);
      if (data.interfaces && data.interfaces.length > 0) {
        setSelectedInterface(data.interfaces[0].name);
        setMonitorMode(data.interfaces[0].monitor_mode);
      }
    } catch (err) {
      console.error('Failed to load interfaces:', err);
      addOutput('Error cargando interfaces', 'error');
    }
  };

  const toggleMonitorMode = async () => {
    if (!selectedInterface) return;
    
    try {
      const res = await fetch(`${API_URL}/api/pentest/monitor-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interface: selectedInterface, enable: !monitorMode })
      });
      
      if (res.ok) {
        setMonitorMode(!monitorMode);
        addOutput(`Modo monitor ${!monitorMode ? 'activado' : 'desactivado'}`, 'success');
        loadInterfaces();
      } else {
        addOutput('Error al cambiar modo monitor', 'error');
      }
    } catch (err) {
      addOutput(`Error: ${err}`, 'error');
    }
  };

  const scanNetworks = async () => {
    if (!selectedInterface) return;
    setScanning(true);
    setNetworks([]);
    addOutput('Escaneando redes WiFi...', 'info');
    
    try {
      const res = await fetch(`${API_URL}/api/pentest/scan-networks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interface: selectedInterface, duration: 15 })
      });
      
      if (res.ok) {
        const data = await res.json();
        setNetworks(data.networks || []);
        addOutput(`✓ Encontradas ${data.count} redes`, 'success');
      } else {
        addOutput('✗ Error en el escaneo', 'error');
      }
    } catch (err) {
      addOutput(`✗ Error: ${err}`, 'error');
    }
    setScanning(false);
  };

  const launchAttack = async (attack: AirgeddonAttack) => {
    if (attack.requiresTarget && !selectedNetwork) {
      addOutput('⚠ Selecciona una red objetivo primero', 'error');
      return;
    }

    setActiveAttack(attack.id);
    setAttackProgress(0);
    addOutput(`⚡ Lanzando: ${attack.name}`, 'info');
    addOutput(`📋 ${attack.description}`, 'info');

    try {
      let endpoint = '';
      let body: any = { interface: selectedInterface };

      switch (attack.id) {
        case 'dos_deauth':
          endpoint = '/api/pentest/deauth-attack';
          body = {
            ...body,
            target_bssid: selectedNetwork.bssid,
            count: 0 // Continuous
          };
          break;
        
        case 'dos_beacon_flood':
          endpoint = '/api/terminal/execute';
          body = {
            command: `mdk3 ${selectedInterface} b -f /tmp/beacon_ssids.txt`,
            user: 'root',
            timeout: 300
          };
          break;

        case 'dos_auth_flood':
          endpoint = '/api/terminal/execute';
          body = {
            command: `mdk3 ${selectedInterface} a -a ${selectedNetwork.bssid}`,
            user: 'root',
            timeout: 300
          };
          break;

        case 'handshake_capture':
        case 'handshake_deauth':
          endpoint = '/api/pentest/capture-handshake';
          body = {
            ...body,
            target_bssid: selectedNetwork.bssid,
            channel: selectedNetwork.channel,
            duration: 120
          };
          break;

        case 'wps_pixie_dust':
        case 'wps_bruteforce':
          endpoint = '/api/pentest/wps-attack';
          body = {
            ...body,
            target_bssid: selectedNetwork.bssid,
            channel: selectedNetwork.channel
          };
          break;

        case 'evil_twin_open':
          endpoint = '/api/evil-twin/create';
          body = {
            ...body,
            ssid: selectedNetwork.ssid,
            channel: selectedNetwork.channel,
            target_mac: selectedNetwork.bssid
          };
          break;

        case 'evil_twin_captive':
          endpoint = '/api/captive-portal/create';
          body = {
            ...body,
            ssid: selectedNetwork.ssid,
            channel: selectedNetwork.channel,
            portal_type: 'google'
          };
          break;

        case 'decrypt_handshake':
          addOutput('⚠ Función de descifrado requiere archivo handshake', 'error');
          setActiveAttack(null);
          return;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session_id) {
          setSessionId(data.session_id);
          addOutput(`✓ Ataque iniciado (sesión: ${data.session_id})`, 'success');
          simulateProgress();
        } else if (data.success) {
          addOutput(`✓ ${data.message || 'Ataque completado'}`, 'success');
          setActiveAttack(null);
        } else {
          addOutput(`⚠ ${data.message || 'Ataque no exitoso'}`, 'error');
          setActiveAttack(null);
        }
      } else {
        addOutput('✗ Error al lanzar ataque', 'error');
        setActiveAttack(null);
      }
    } catch (err) {
      addOutput(`✗ Error: ${err}`, 'error');
      setActiveAttack(null);
    }
  };

  const stopAttack = async () => {
    if (!sessionId) {
      setActiveAttack(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/pentest/stop-session/${sessionId}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        addOutput('✓ Ataque detenido', 'success');
      } else {
        addOutput('⚠ Error al detener ataque', 'error');
      }
    } catch (err) {
      addOutput(`✗ Error: ${err}`, 'error');
    }
    
    setActiveAttack(null);
    setSessionId(null);
    setAttackProgress(0);
  };

  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setAttackProgress(Math.min(progress, 100));
    }, 1000);
  };

  const addOutput = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    setAttackOutput(prev => [`[${timestamp}] ${prefix} ${text}`, ...prev].slice(0, 100));
  };

  const getAttacksByCategory = (category: string) => {
    return attacks.filter(a => a.category === category);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Shield className="text-red-400" size={36} />
            Airgeddon - Suite Completa de Auditoría WiFi
          </h2>
          <p className="text-slate-400">Herramienta multi-ataque para pentesting WiFi profesional</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <AlertTriangle className="text-red-400" size={20} />
          <span className="text-red-200 text-sm font-bold">USO AUTORIZADO ÚNICAMENTE</span>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-rf-panel border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity size={20} className="text-rf-accent" />
          Configuración de Interface
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Interface Inalámbrica</label>
            <select
              value={selectedInterface}
              onChange={(e) => {
                setSelectedInterface(e.target.value);
                const iface = interfaces.find(i => i.name === e.target.value);
                setMonitorMode(iface?.monitor_mode || false);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
            >
              {interfaces.map(iface => (
                <option key={iface.name} value={iface.name}>
                  {iface.name} - {iface.mac}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={toggleMonitorMode}
              disabled={!selectedInterface}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-bold transition-all ${
                monitorMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {monitorMode ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              Modo Monitor: {monitorMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={scanNetworks}
              disabled={scanning || !monitorMode}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rf-accent hover:bg-rf-accent/80 text-slate-900 rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? <Loader2 className="animate-spin" size={20} /> : <Target size={20} />}
              {scanning ? 'Escaneando...' : 'Escanear Redes'}
            </button>
          </div>
        </div>
      </div>

      {/* Networks List */}
      {networks.length > 0 && (
        <div className="bg-rf-panel border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Wifi size={20} className="text-rf-accent" />
            Redes Detectadas ({networks.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr className="text-left">
                  <th className="p-3 font-bold text-slate-300">SSID</th>
                  <th className="p-3 font-bold text-slate-300">BSSID</th>
                  <th className="p-3 font-bold text-slate-300">CH</th>
                  <th className="p-3 font-bold text-slate-300">PWR</th>
                  <th className="p-3 font-bold text-slate-300">ENC</th>
                  <th className="p-3 font-bold text-slate-300">Clientes</th>
                  <th className="p-3 font-bold text-slate-300">Acción</th>
                </tr>
              </thead>
              <tbody>
                {networks.map((net, idx) => (
                  <tr
                    key={idx}
                    className={`border-t border-slate-700 hover:bg-slate-800/50 cursor-pointer ${
                      selectedNetwork?.bssid === net.bssid ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedNetwork(net)}
                  >
                    <td className="p-3 text-white font-bold">{net.ssid || '<oculto>'}</td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{net.bssid}</td>
                    <td className="p-3 text-slate-300">{net.channel}</td>
                    <td className="p-3 text-slate-300">{net.rssi} dBm</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        net.encryption?.includes('WPA') ? 'bg-red-500/20 text-red-400' :
                        net.encryption?.includes('WEP') ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {net.encryption || 'Open'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{net.clients || 0}</td>
                    <td className="p-3">
                      {selectedNetwork?.bssid === net.bssid && (
                        <span className="text-blue-400 text-xs font-bold flex items-center gap-1">
                          <Eye size={14} /> OBJETIVO
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attack Categories */}
      <div className="space-y-6">
        {/* DoS Attacks */}
        <div className="bg-rf-panel border border-red-700/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <Zap size={20} />
            Ataques de Denegación de Servicio (DoS)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getAttacksByCategory('dos').map((attack) => (
              <button
                key={attack.id}
                onClick={() => launchAttack(attack)}
                disabled={activeAttack !== null || (attack.requiresTarget && !selectedNetwork) || !monitorMode}
                className={`flex flex-col items-center gap-3 p-6 ${attack.color} hover:opacity-80 border-2 border-transparent hover:border-white/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="text-white">{attack.icon}</div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{attack.name}</div>
                  <div className="text-white/80 text-xs mt-1">{attack.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Handshake Capture */}
        <div className="bg-rf-panel border border-blue-700/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
            <Key size={20} />
            Captura de Handshake WPA/WPA2
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getAttacksByCategory('handshake').map((attack) => (
              <button
                key={attack.id}
                onClick={() => launchAttack(attack)}
                disabled={activeAttack !== null || !selectedNetwork || !monitorMode}
                className={`flex flex-col items-center gap-3 p-6 ${attack.color} hover:opacity-80 border-2 border-transparent hover:border-white/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="text-white">{attack.icon}</div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{attack.name}</div>
                  <div className="text-white/80 text-xs mt-1">{attack.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* WPS Attacks */}
        <div className="bg-rf-panel border border-purple-700/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Zap size={20} />
            Ataques WPS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getAttacksByCategory('wps').map((attack) => (
              <button
                key={attack.id}
                onClick={() => launchAttack(attack)}
                disabled={activeAttack !== null || !selectedNetwork || !monitorMode}
                className={`flex flex-col items-center gap-3 p-6 ${attack.color} hover:opacity-80 border-2 border-transparent hover:border-white/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="text-white">{attack.icon}</div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{attack.name}</div>
                  <div className="text-white/80 text-xs mt-1">{attack.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Evil Twin */}
        <div className="bg-rf-panel border border-indigo-700/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">
            <Globe size={20} />
            Evil Twin & Portal Cautivo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getAttacksByCategory('evil_twin').map((attack) => (
              <button
                key={attack.id}
                onClick={() => launchAttack(attack)}
                disabled={activeAttack !== null || !selectedNetwork || !monitorMode}
                className={`flex flex-col items-center gap-3 p-6 ${attack.color} hover:opacity-80 border-2 border-transparent hover:border-white/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="text-white">{attack.icon}</div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{attack.name}</div>
                  <div className="text-white/80 text-xs mt-1">{attack.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Attack Status */}
      {activeAttack && (
        <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-yellow-200 flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                Ataque en Progreso
              </h3>
              <p className="text-yellow-300/70 text-sm mt-1">
                {attacks.find(a => a.id === activeAttack)?.name}
              </p>
            </div>
            <button
              onClick={stopAttack}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-all"
            >
              <Square size={16} />
              Detener Ataque
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
              style={{ width: `${attackProgress}%` }}
            />
          </div>
          <p className="text-center text-yellow-200 text-sm mt-2 font-mono">
            {attackProgress.toFixed(0)}% completado
          </p>
        </div>
      )}

      {/* Output Console */}
      <div className="bg-rf-panel border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity size={20} className="text-rf-accent" />
          Consola de Salida
        </h3>
        <div className="bg-slate-950 rounded p-4 h-64 overflow-y-auto font-mono text-sm">
          {attackOutput.length === 0 ? (
            <p className="text-slate-500">Esperando acción...</p>
          ) : (
            attackOutput.map((line, idx) => (
              <div
                key={idx}
                className={`mb-1 ${
                  line.includes('✓') ? 'text-green-400' :
                  line.includes('✗') ? 'text-red-400' :
                  line.includes('⚠') ? 'text-yellow-400' :
                  'text-slate-300'
                }`}
              >
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-300 mb-3">Acerca de Airgeddon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div>
            <h4 className="font-bold text-blue-400 mb-2">Características</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Suite completa multi-ataque WiFi</li>
              <li>Ataques DoS (Deauth, Beacon, Auth flood)</li>
              <li>Captura de handshakes WPA/WPA2</li>
              <li>Ataques WPS (Pixie Dust, Bruteforce)</li>
              <li>Evil Twin con portal cautivo</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-blue-400 mb-2">Requisitos</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Interface en modo monitor</li>
              <li>Herramientas: aircrack-ng, reaver, mdk3/mdk4</li>
              <li>Permisos de root</li>
              <li>Adaptador WiFi compatible</li>
              <li>Autorización escrita para testing</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          <strong>⚠️ ADVERTENCIA LEGAL:</strong> El uso de estas herramientas en redes sin autorización es ilegal.
          Solo para uso educativo en entornos controlados con autorización explícita.
        </div>
      </div>
    </div>
  );
};
