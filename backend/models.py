from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    """User model for authentication with system-level access"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    access_code = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # ADMIN (root) or STUDENT (user)
    system_user = Column(String(100), nullable=True)  # System username for execution
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

class SignalLog(Base):
    """Signal capture log entries"""
    __tablename__ = "signal_logs"
    
    id = Column(String(36), primary_key=True)  # UUID
    timestamp = Column(Integer, nullable=False)  # Unix timestamp in ms
    frequency = Column(Float, nullable=False)  # MHz
    bandwidth = Column(Float, nullable=False)  # MHz
    peak_db = Column(Float, nullable=False)  # dBFS
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BluetoothScan(Base):
    """Bluetooth device scan results"""
    __tablename__ = "bluetooth_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    mac_address = Column(String(17), nullable=False)
    device_name = Column(String(255), nullable=True)
    rssi = Column(Integer, nullable=False)
    cod = Column(String(50), nullable=True)  # Class of Device
    vendor = Column(String(255), nullable=True)
    is_connected = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    scan_timestamp = Column(DateTime(timezone=True), server_default=func.now())

class WifiScan(Base):
    """WiFi network scan results"""
    __tablename__ = "wifi_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    ssid = Column(String(255), nullable=False)
    bssid = Column(String(17), nullable=False)
    channel = Column(Integer, nullable=False)
    rssi = Column(Integer, nullable=False)
    security = Column(String(50), nullable=True)
    vendor = Column(String(255), nullable=True)
    band = Column(String(10), nullable=False)  # 2.4GHz, 5GHz, 6GHz
    width = Column(Integer, nullable=True)  # Channel width in MHz
    scan_timestamp = Column(DateTime(timezone=True), server_default=func.now())

class PentestSession(Base):
    """Pentesting tool execution sessions"""
    __tablename__ = "pentest_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), unique=True, nullable=False)  # UUID
    tool_name = Column(String(100), nullable=False)  # wifite, airgeddon, reaver, etc.
    user_id = Column(Integer, nullable=True)
    interface = Column(String(50), nullable=True)  # Wireless interface
    target_bssid = Column(String(17), nullable=True)
    target_ssid = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False)  # running, stopped, completed, failed
    pid = Column(Integer, nullable=True)  # Process ID
    command = Column(Text, nullable=True)
    output_log = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

class WifiAttackResult(Base):
    """Results from WiFi penetration testing attacks"""
    __tablename__ = "wifi_attack_results"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), nullable=False)
    attack_type = Column(String(50), nullable=False)  # deauth, handshake, wps, evil_portal
    target_bssid = Column(String(17), nullable=False)
    target_ssid = Column(String(255), nullable=True)
    success = Column(Boolean, default=False)
    handshake_captured = Column(Boolean, default=False)
    handshake_file = Column(String(500), nullable=True)
    wps_pin = Column(String(20), nullable=True)
    password = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
