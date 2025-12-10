// RF Configuration Types
export interface RadioConfig {
  centerFreq: number; // in MHz
  sampleRate: number; // in MSps
  gain: number; // in dB
  bandwidth: number; // in MHz
}

// Data Point for Spectrum
export interface SpectrumPoint {
  frequency: number; // MHz
  db: number; // dBFS
}

// Log Entry for Captured Signals
export interface SignalLog {
  id: string;
  timestamp: number;
  frequency: number;
  bandwidth: number;
  peakDb: number;
  notes: string;
}

// Bluetooth Types
export interface BluetoothDevice {
  mac: string;
  name: string;
  rssi: number;
  cod: string; // Class of Device
  vendor: string;
  lastSeen: number;
  isConnected?: boolean;
}

// WiFi Types
export type WifiBand = '2.4GHz' | '5GHz' | '6GHz';

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  channel: number;
  rssi: number;
  security: string;
  vendor: string;
  band: WifiBand;
  width?: number; // MHz (20, 40, 80)
}

// Modo S Status
export enum ModoSState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE', // Transmitting interference pattern
  WINDOW = 'WINDOW'  // 10s pause window
}

// KPI Data Types
export interface KpiStats {
  uptimeSeconds: number;
  packetsCaptured: number;
  threatsBlocked: number;
  activeDevices: number;
  storageUsagePercent: number;
  cpuTemp: number;
}

// User Auth Types
export interface UserSession {
  username: string;
  role: 'STUDENT' | 'PROFESSOR';
  isAuthenticated: boolean;
  onboardingComplete: boolean;
}

// Navigation Tabs
export enum AppTab {
  DASHBOARD = 'DASHBOARD', // KPI Dashboard
  SPECTRUM = 'SPECTRUM',   // Previous Dashboard
  BLUETOOTH = 'BLUETOOTH',
  WIFI = 'WIFI',
  LOGS = 'LOGS',
  ANALYSIS = 'ANALYSIS',
  SETTINGS = 'SETTINGS'
}