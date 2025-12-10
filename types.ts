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
  bandwidth: number; // Changed from 'type' to bandwidth to match previous usage, or keep consistent
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
  isConnected?: boolean; // Connection status
}

// WiFi Types
export interface WifiNetwork {
  ssid: string;
  bssid: string;
  channel: number;
  rssi: number;
  security: string;
  vendor: string;
}

// Modo S Status
export enum ModoSState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE', // Transmitting interference pattern
  WINDOW = 'WINDOW'  // 10s pause window
}

// KPI Data Types
export interface KpiData {
  totalDevices: number;
  avgRssi: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  activeTime: number; // seconds
  vendorDistribution: { name: string; count: number }[];
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
  DASHBOARD = 'DASHBOARD',
  BLUETOOTH = 'BLUETOOTH',
  WIFI = 'WIFI',
  LOGS = 'LOGS',
  ANALYSIS = 'ANALYSIS',
  SETTINGS = 'SETTINGS',
  KPI = 'KPI'
}