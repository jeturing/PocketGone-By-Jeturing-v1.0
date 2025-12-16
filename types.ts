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
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  isAuthenticated: boolean;
  onboardingComplete: boolean;
}

// Navigation Tabs
export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  SPECTRUM = 'SPECTRUM',
  BLUETOOTH = 'BLUETOOTH',
  WIFI = 'WIFI',
  PENTEST = 'PENTEST',     // New: Pentesting Tools
  TERMINAL = 'TERMINAL',   // New: Web Terminal
  EVIL_TWIN = 'EVIL_TWIN', // New: Evil Twin/Captive Portal
  AIRGEDDON = 'AIRGEDDON', // New: Airgeddon Suite
  LOGS = 'LOGS',
  ANALYSIS = 'ANALYSIS',
  SETTINGS = 'SETTINGS'
}

// Pentesting Types
export interface WirelessInterface {
  name: string;
  mac: string;
  monitor_mode: boolean;
  status: string;
}

export interface PentestTools {
  'aircrack-ng': boolean;
  'airmon-ng': boolean;
  'airodump-ng': boolean;
  'aireplay-ng': boolean;
  'wifite': boolean;
  'reaver': boolean;
  'wash': boolean;
  'mdk3': boolean;
  'mdk4': boolean;
}

export interface AttackSession {
  session_id: string;
  status: string;
  tool_name?: string;
  pid?: number;
}

export interface AttackResult {
  id: number;
  session_id: string;
  attack_type: string;
  target_bssid: string;
  target_ssid?: string;
  success: boolean;
  handshake_captured?: boolean;
  handshake_file?: string;
  wps_pin?: string;
  password?: string;
  notes?: string;
  created_at?: string;
}

export interface CaptivePortalInfo {
  ap_id: string;
  ssid: string;
  channel: number;
  portal_type: string;
  interface: string;
  status: string;
  credentials: string[];
}

export interface TerminalOutput {
  type: 'output' | 'error' | 'info' | 'success';
  text: string;
  timestamp: number;
}