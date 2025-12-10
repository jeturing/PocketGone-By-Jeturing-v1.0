import { RadioConfig, SpectrumPoint, BluetoothDevice, WifiNetwork } from '../types';

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
    // We request any device. In a real app, filters (services) are usually required.
    // acceptAllDevices: true is the broadest scan possible.
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['battery_service'] // Example service to try and access
    });

    return {
      mac: device.id, // Browsers obfuscate the real MAC for privacy, giving a UUID
      name: device.name || 'Unknown Browser Device',
      rssi: -50, // Browser API (requestDevice) does not return RSSI on selection. We default to a strong signal.
      cod: 'Browser/BLE',
      vendor: 'Unknown',
      lastSeen: Date.now(),
      isConnected: device.gatt ? device.gatt.connected : false
    };
  } catch (error: any) {
    // If it's a policy/security error, throw it so the UI can explain it to the user
    if (error.name === 'SecurityError' || (error.message && error.message.includes('policy'))) {
        throw error;
    }
    // If user cancelled, just return null (no action needed)
    console.log("User cancelled bluetooth request or other error:", error);
    return null;
  }
};

// API ENDPOINT FOR RASPBERRY PI BACKEND
const API_URL = 'http://localhost:8000';

// Helper to add noise
const noise = (base: number, variance: number) => base + (Math.random() * variance);

// Hybrid Spectrum Generator (Backend -> Fallback to Simulation)
export const generateSpectrumData = async (config: RadioConfig, points: number = 128, modoSActive: boolean = false): Promise<SpectrumPoint[]> => {
  try {
    // 1. Try Real Backend
    const response = await fetch(`${API_URL}/api/fft/live`);
    if (response.ok) {
        const data = await response.json();
        return data.points; // Assuming backend returns { points: [...] }
    }
  } catch (e) {
    // Backend offline, fall through to simulation
  }

  // 2. Fallback Simulation
  const data: SpectrumPoint[] = [];
  const startFreq = config.centerFreq - (config.bandwidth / 2);
  const step = config.bandwidth / points;
  
  const time = Date.now() / 1000;

  for (let i = 0; i < points; i++) {
    const freq = startFreq + (i * step);
    let signalDb = noise(-90, 10); // Noise floor
    
    // Simulate Signals based on bands

    // FM Radio (88-108)
    if (freq > 88 && freq < 108) {
      if (Math.abs(freq - 98.5) < 0.2) signalDb = Math.max(signalDb, noise(-40, 5));
      if (Math.abs(freq - 101.1) < 0.2) signalDb = Math.max(signalDb, noise(-50, 5));
    }

    // ISM 2.4GHz (WiFi/BT)
    if (freq > 2400 && freq < 2483) {
      const ch1 = 2412;
      const ch6 = 2437;
      const ch11 = 2462;
      
      [ch1, ch6, ch11].forEach(ch => {
         const dist = Math.abs(freq - ch);
         if (dist < 10) {
            signalDb = Math.max(signalDb, -60 * (1 - dist/10) + noise(-10, 5));
         }
      });

      if (Math.random() > 0.8) {
         signalDb = Math.max(signalDb, noise(-50, 15));
      }

      if (modoSActive) {
         const hopPattern = Math.sin(freq * 10 + time * 20);
         if (hopPattern > 0.8) {
            signalDb = Math.max(signalDb, noise(-20, 5)); 
         }
      }
    }
    
    data.push({
      frequency: freq,
      db: signalDb
    });
  }

  return data;
};

// Hybrid Bluetooth Scan
export const scanBluetoothDevices = async (): Promise<BluetoothDevice[]> => {
  try {
    const response = await fetch(`${API_URL}/api/bt/scan`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // Ignore error, fallback
  }

  // Fallback Simulation with mixed connection states for UI demo
  return [
    { mac: 'A0:EF:4A:83:86:88', name: 'JBL Flip 5', rssi: -64, cod: 'Audio/Video', vendor: 'JBL', lastSeen: Date.now(), isConnected: true },
    { mac: '40:EF:4C:86:86:89', name: 'AUVIO PBT200', rssi: -59, cod: 'Audio/Video', vendor: 'Unknown', lastSeen: Date.now(), isConnected: false },
    { mac: 'XX:XX:XX:XX:XX:XX', name: 'Unknown Device', rssi: -85, cod: 'Wearable', vendor: 'Apple', lastSeen: Date.now() - 5000, isConnected: false },
    { mac: '12:34:56:78:90:AB', name: 'Smart TV', rssi: -72, cod: 'Display', vendor: 'Samsung', lastSeen: Date.now() - 12000, isConnected: undefined }, // Unknown status demo
  ];
};

// Hybrid WiFi Scan
export const scanWifiNetworks = async (): Promise<WifiNetwork[]> => {
  try {
    const response = await fetch(`${API_URL}/api/wifi/scan`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // Ignore error
  }

  // Fallback Simulation
  return [
    { ssid: 'Campus_Guest', bssid: 'AA:BB:CC:DD:EE:01', channel: 1, rssi: -55, security: 'WPA2', vendor: 'Cisco' },
    { ssid: 'Lab_Secure', bssid: 'AA:BB:CC:DD:EE:02', channel: 6, rssi: -42, security: 'WPA3', vendor: 'Ubiquiti' },
    { ssid: 'Staff_Only', bssid: 'AA:BB:CC:DD:EE:03', channel: 11, rssi: -68, security: 'WPA2', vendor: 'Cisco' },
    { ssid: 'Printer_Direct', bssid: 'AA:BB:CC:DD:EE:04', channel: 1, rssi: -80, security: 'WEP', vendor: 'HP' },
  ];
};

export const formatFrequency = (mhz: number): string => {
  if (mhz >= 1000) {
    return `${(mhz / 1000).toFixed(4)} GHz`;
  }
  return `${mhz.toFixed(3)} MHz`;
};