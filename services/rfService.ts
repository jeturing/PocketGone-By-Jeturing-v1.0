import { RadioConfig, SpectrumPoint, BluetoothDevice, WifiNetwork, KpiStats, WifiBand } from '../types';

// Detect if we are in a browser environment that supports Bluetooth
export const isWebBluetoothSupported = () => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

// Request a Bluetooth Device via Browser API
export const requestBrowserBluetoothDevice = async (): Promise<BluetoothDevice | null> => {
  if (!isWebBluetoothSupported()) {
    throw new Error("Web Bluetooth API not supported in this browser.");
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['battery_service'] 
    });

    return {
      mac: device.id, 
      name: device.name || 'Unknown Browser Device',
      rssi: -50, 
      cod: 'Browser/BLE',
      vendor: 'Unknown',
      lastSeen: Date.now(),
      isConnected: device.gatt ? device.gatt.connected : false
    };
  } catch (error: any) {
    if (error.name === 'SecurityError' || (error.message && error.message.includes('policy'))) {
        throw error;
    }
    console.log("User cancelled bluetooth request or other error:", error);
    return null;
  }
};

const API_URL = 'http://localhost:8000';

const noise = (base: number, variance: number) => base + (Math.random() * variance);

export const generateSpectrumData = async (config: RadioConfig, points: number = 128, modoSActive: boolean = false): Promise<SpectrumPoint[]> => {
  try {
    const response = await fetch(`${API_URL}/api/fft/live`);
    if (response.ok) {
        const data = await response.json();
        return data.points; 
    }
  } catch (e) { }

  const data: SpectrumPoint[] = [];
  const startFreq = config.centerFreq - (config.bandwidth / 2);
  const step = config.bandwidth / points;
  const time = Date.now() / 1000;

  for (let i = 0; i < points; i++) {
    const freq = startFreq + (i * step);
    let signalDb = noise(-90, 10);
    
    if (freq > 88 && freq < 108) {
      if (Math.abs(freq - 98.5) < 0.2) signalDb = Math.max(signalDb, noise(-40, 5));
    }

    if (freq > 2400 && freq < 2483) {
      [2412, 2437, 2462].forEach(ch => {
         const dist = Math.abs(freq - ch);
         if (dist < 10) signalDb = Math.max(signalDb, -60 * (1 - dist/10) + noise(-10, 5));
      });
      if (modoSActive) {
         const hopPattern = Math.sin(freq * 10 + time * 20);
         if (hopPattern > 0.8) signalDb = Math.max(signalDb, noise(-20, 5)); 
      }
    }
    data.push({ frequency: freq, db: signalDb });
  }
  return data;
};

export const scanBluetoothDevices = async (): Promise<BluetoothDevice[]> => {
  try {
    const response = await fetch(`${API_URL}/api/bt/scan`);
    if (response.ok) return await response.json();
  } catch (e) { }

  return [
    { mac: 'A0:EF:4A:83:86:88', name: 'JBL Flip 5', rssi: -64, cod: 'Audio/Video', vendor: 'JBL', lastSeen: Date.now(), isConnected: true },
    { mac: '40:EF:4C:86:86:89', name: 'AUVIO PBT200', rssi: -59, cod: 'Audio/Video', vendor: 'Unknown', lastSeen: Date.now(), isConnected: false },
    { mac: 'XX:XX:XX:XX:XX:XX', name: 'Unknown Device', rssi: -85, cod: 'Wearable', vendor: 'Apple', lastSeen: Date.now() - 5000, isConnected: false },
    { mac: '12:34:56:78:90:AB', name: 'Smart TV', rssi: -72, cod: 'Display', vendor: 'Samsung', lastSeen: Date.now() - 12000, isConnected: undefined }, 
  ];
};

export const scanWifiNetworks = async (band: WifiBand): Promise<WifiNetwork[]> => {
  try {
    const response = await fetch(`${API_URL}/api/wifi/scan?band=${band}`);
    if (response.ok) return await response.json();
  } catch (e) { }

  // Fallback Simulation based on Band
  const networks: WifiNetwork[] = [];
  
  if (band === '2.4GHz') {
     networks.push(
        { ssid: 'Campus_Guest', bssid: 'AA:BB:CC:DD:EE:01', channel: 1, rssi: -55, security: 'WPA2', vendor: 'Cisco', band: '2.4GHz', width: 20 },
        { ssid: 'Lab_Secure', bssid: 'AA:BB:CC:DD:EE:02', channel: 6, rssi: -42, security: 'WPA3', vendor: 'Ubiquiti', band: '2.4GHz', width: 20 },
        { ssid: 'IoT_Devices', bssid: 'AA:BB:CC:DD:EE:05', channel: 11, rssi: -70, security: 'WPA2', vendor: 'Espressif', band: '2.4GHz', width: 20 }
     );
  } else if (band === '5GHz') {
     networks.push(
        { ssid: 'Campus_Staff_5G', bssid: 'AA:BB:CC:DD:FF:01', channel: 36, rssi: -60, security: 'WPA2/Ent', vendor: 'Cisco', band: '5GHz', width: 40 },
        { ssid: 'Research_Lab_HighSpeed', bssid: 'AA:BB:CC:DD:FF:02', channel: 149, rssi: -48, security: 'WPA3', vendor: 'Aruba', band: '5GHz', width: 80 }
     );
  } else if (band === '6GHz') {
     // Fewer devices in 6GHz usually
     networks.push(
        { ssid: 'Future_Net_6E', bssid: 'AA:BB:CC:DD:EE:99', channel: 33, rssi: -85, security: 'WPA3/OWE', vendor: 'Netgear', band: '6GHz', width: 160 }
     );
  }

  return networks;
};

export const getSystemStats = async (): Promise<KpiStats> => {
    // Simulated KPI stats
    return {
        uptimeSeconds: 12450,
        packetsCaptured: 1048576,
        threatsBlocked: 23,
        activeDevices: 42,
        storageUsagePercent: 65,
        cpuTemp: 48
    };
};

export const formatFrequency = (mhz: number): string => {
  if (mhz >= 1000) return `${(mhz / 1000).toFixed(4)} GHz`;
  return `${mhz.toFixed(3)} MHz`;
};