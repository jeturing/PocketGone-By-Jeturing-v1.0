from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
import numpy as np
import time

from database import get_db, init_db
from models import User, SignalLog, BluetoothScan, WifiScan

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("✓ PocketGone Backend Server Started")
    print("✓ Database initialized")
    yield
    # Shutdown (if needed)

# Initialize FastAPI app
app = FastAPI(
    title="PocketGone Backend API",
    description="RF Spectrum Analysis, Bluetooth Diagnostics, and WiFi Lab Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    access_code: str

class UserResponse(BaseModel):
    username: str
    role: str
    is_authenticated: bool
    onboarding_complete: bool

class SpectrumPoint(BaseModel):
    frequency: float
    db: float

class SpectrumDataResponse(BaseModel):
    points: List[SpectrumPoint]
    timestamp: int
    config: dict

class BluetoothDeviceResponse(BaseModel):
    mac: str
    name: str
    rssi: int
    cod: str
    vendor: str
    lastSeen: int
    isConnected: Optional[bool] = False

class WifiNetworkResponse(BaseModel):
    ssid: str
    bssid: str
    channel: int
    rssi: int
    security: str
    vendor: str
    band: str
    width: Optional[int] = 20

class KpiStatsResponse(BaseModel):
    uptimeSeconds: int
    packetsCaptured: int
    threatsBlocked: int
    activeDevices: int
    storageUsagePercent: int
    cpuTemp: int

class SignalLogCreate(BaseModel):
    id: str
    timestamp: int
    frequency: float
    bandwidth: float
    peakDb: float
    notes: str

class SignalLogResponse(BaseModel):
    id: str
    timestamp: int
    frequency: float
    bandwidth: float
    peak_db: float
    notes: str

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/login", response_model=UserResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with access code"""
    user = db.query(User).filter(User.access_code == request.access_code).first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid access code")
    
    # Update last login
    user.last_login = datetime.now()
    db.commit()
    
    return UserResponse(
        username=user.username,
        role=user.role,
        is_authenticated=True,
        onboarding_complete=True
    )

@app.get("/api/auth/session")
async def get_session():
    """Check session status - frontend handles session via localStorage"""
    return {"status": "Session management handled client-side"}

# ============================================================================
# RF SPECTRUM ENDPOINTS
# ============================================================================

def generate_spectrum_data(center_freq: float = 98.5, bandwidth: float = 2.0, 
                          points: int = 128, modo_s_active: bool = False) -> List[SpectrumPoint]:
    """Generate simulated RF spectrum data"""
    data = []
    start_freq = center_freq - (bandwidth / 2)
    step = bandwidth / points
    current_time = time.time()
    
    for i in range(points):
        freq = start_freq + (i * step)
        # Base noise floor
        signal_db = -90 + np.random.uniform(-10, 10)
        
        # FM Radio band simulation (88-108 MHz)
        if 88 < freq < 108:
            if abs(freq - 98.5) < 0.2:
                signal_db = max(signal_db, -40 + np.random.uniform(-5, 5))
        
        # WiFi/Bluetooth 2.4 GHz band simulation
        if 2400 < freq < 2483:
            # WiFi channels 1, 6, 11
            for channel_freq in [2412, 2437, 2462]:
                dist = abs(freq - channel_freq)
                if dist < 10:
                    signal_db = max(signal_db, -60 * (1 - dist/10) + np.random.uniform(-10, 5))
            
            # Modo S interference pattern
            if modo_s_active:
                hop_pattern = np.sin(freq * 10 + current_time * 20)
                if hop_pattern > 0.8:
                    signal_db = max(signal_db, -20 + np.random.uniform(-5, 5))
        
        data.append(SpectrumPoint(frequency=freq, db=signal_db))
    
    return data

@app.get("/api/fft/live", response_model=SpectrumDataResponse)
async def get_live_spectrum(
    center_freq: float = 98.5,
    bandwidth: float = 2.0,
    points: int = 128,
    modo_s: bool = False
):
    """Get live RF spectrum data"""
    spectrum_points = generate_spectrum_data(center_freq, bandwidth, points, modo_s)
    
    return SpectrumDataResponse(
        points=spectrum_points,
        timestamp=int(time.time() * 1000),
        config={
            "centerFreq": center_freq,
            "bandwidth": bandwidth,
            "points": points
        }
    )

# ============================================================================
# BLUETOOTH ENDPOINTS
# ============================================================================

@app.get("/api/bt/scan", response_model=List[BluetoothDeviceResponse])
async def scan_bluetooth(db: Session = Depends(get_db)):
    """Scan for Bluetooth devices (simulated educational data)"""
    
    # Simulated device data for educational purposes
    devices = [
        BluetoothDeviceResponse(
            mac="A0:EF:4A:83:86:88",
            name="JBL Flip 5",
            rssi=-64,
            cod="Audio/Video",
            vendor="JBL",
            lastSeen=int(time.time() * 1000),
            isConnected=True
        ),
        BluetoothDeviceResponse(
            mac="40:EF:4C:86:86:89",
            name="AUVIO PBT200",
            rssi=-59,
            cod="Audio/Video",
            vendor="Unknown",
            lastSeen=int(time.time() * 1000),
            isConnected=False
        ),
        BluetoothDeviceResponse(
            mac="XX:XX:XX:XX:XX:XX",
            name="Unknown Device",
            rssi=-85,
            cod="Wearable",
            vendor="Apple",
            lastSeen=int(time.time() * 1000) - 5000,
            isConnected=False
        ),
        BluetoothDeviceResponse(
            mac="12:34:56:78:90:AB",
            name="Smart TV",
            rssi=-72,
            cod="Display",
            vendor="Samsung",
            lastSeen=int(time.time() * 1000) - 12000,
            isConnected=False
        ),
    ]
    
    # Optionally store in database
    for device in devices:
        bt_scan = BluetoothScan(
            mac_address=device.mac,
            device_name=device.name,
            rssi=device.rssi,
            cod=device.cod,
            vendor=device.vendor,
            is_connected=device.isConnected or False
        )
        db.merge(bt_scan)
    
    try:
        db.commit()
    except SQLAlchemyError as e:
        print(f"Database error storing Bluetooth scans: {e}")
        db.rollback()
    
    return devices

# ============================================================================
# WIFI ENDPOINTS
# ============================================================================

@app.get("/api/wifi/scan", response_model=List[WifiNetworkResponse])
async def scan_wifi(band: str = "2.4GHz", db: Session = Depends(get_db)):
    """Scan for WiFi networks (simulated educational data)"""
    
    networks = []
    
    if band == "2.4GHz":
        networks = [
            WifiNetworkResponse(
                ssid="Campus_Guest",
                bssid="AA:BB:CC:DD:EE:01",
                channel=1,
                rssi=-55,
                security="WPA2",
                vendor="Cisco",
                band="2.4GHz",
                width=20
            ),
            WifiNetworkResponse(
                ssid="Lab_Secure",
                bssid="AA:BB:CC:DD:EE:02",
                channel=6,
                rssi=-42,
                security="WPA3",
                vendor="Ubiquiti",
                band="2.4GHz",
                width=20
            ),
            WifiNetworkResponse(
                ssid="IoT_Devices",
                bssid="AA:BB:CC:DD:EE:05",
                channel=11,
                rssi=-70,
                security="WPA2",
                vendor="Espressif",
                band="2.4GHz",
                width=20
            )
        ]
    elif band == "5GHz":
        networks = [
            WifiNetworkResponse(
                ssid="Campus_Staff_5G",
                bssid="AA:BB:CC:DD:FF:01",
                channel=36,
                rssi=-60,
                security="WPA2/Ent",
                vendor="Cisco",
                band="5GHz",
                width=40
            ),
            WifiNetworkResponse(
                ssid="Research_Lab_HighSpeed",
                bssid="AA:BB:CC:DD:FF:02",
                channel=149,
                rssi=-48,
                security="WPA3",
                vendor="Aruba",
                band="5GHz",
                width=80
            )
        ]
    elif band == "6GHz":
        networks = [
            WifiNetworkResponse(
                ssid="Future_Net_6E",
                bssid="AA:BB:CC:DD:EE:99",
                channel=33,
                rssi=-85,
                security="WPA3/OWE",
                vendor="Netgear",
                band="6GHz",
                width=160
            )
        ]
    
    # Optionally store in database
    for network in networks:
        wifi_scan = WifiScan(
            ssid=network.ssid,
            bssid=network.bssid,
            channel=network.channel,
            rssi=network.rssi,
            security=network.security,
            vendor=network.vendor,
            band=network.band,
            width=network.width
        )
        db.add(wifi_scan)
    
    try:
        db.commit()
    except SQLAlchemyError as e:
        print(f"Database error storing WiFi scans: {e}")
        db.rollback()
    
    return networks

# ============================================================================
# SIGNAL LOGS ENDPOINTS
# ============================================================================

@app.post("/api/logs", response_model=SignalLogResponse)
async def create_signal_log(log: SignalLogCreate, db: Session = Depends(get_db)):
    """Create a new signal log entry"""
    
    db_log = SignalLog(
        id=log.id,
        timestamp=log.timestamp,
        frequency=log.frequency,
        bandwidth=log.bandwidth,
        peak_db=log.peakDb,
        notes=log.notes
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return SignalLogResponse(
        id=db_log.id,
        timestamp=db_log.timestamp,
        frequency=db_log.frequency,
        bandwidth=db_log.bandwidth,
        peak_db=db_log.peak_db,
        notes=db_log.notes or ""
    )

@app.get("/api/logs", response_model=List[SignalLogResponse])
async def get_signal_logs(limit: int = 100, db: Session = Depends(get_db)):
    """Get all signal log entries"""
    
    logs = db.query(SignalLog).order_by(SignalLog.timestamp.desc()).limit(limit).all()
    
    return [
        SignalLogResponse(
            id=log.id,
            timestamp=log.timestamp,
            frequency=log.frequency,
            bandwidth=log.bandwidth,
            peak_db=log.peak_db,
            notes=log.notes or ""
        )
        for log in logs
    ]

@app.delete("/api/logs/{log_id}")
async def delete_signal_log(log_id: str, db: Session = Depends(get_db)):
    """Delete a signal log entry"""
    
    log = db.query(SignalLog).filter(SignalLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    db.commit()
    
    return {"status": "deleted", "id": log_id}

# ============================================================================
# KPI / STATS ENDPOINTS
# ============================================================================

@app.get("/api/stats/kpi", response_model=KpiStatsResponse)
async def get_kpi_stats(db: Session = Depends(get_db)):
    """Get system KPI statistics"""
    
    # Calculate real statistics from database
    total_bt_scans = db.query(BluetoothScan).count()
    total_wifi_scans = db.query(WifiScan).count()
    total_logs = db.query(SignalLog).count()
    
    # Simulated stats (in production, these would be real system metrics)
    return KpiStatsResponse(
        uptimeSeconds=12450,
        packetsCaptured=total_bt_scans + total_wifi_scans + total_logs,
        threatsBlocked=23,
        activeDevices=42,
        storageUsagePercent=65,
        cpuTemp=48
    )

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "online",
        "service": "PocketGone Backend API",
        "version": "1.0.0",
        "message": "RF Spectrum Analysis, Bluetooth Diagnostics, and WiFi Lab"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": int(time.time() * 1000),
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
