from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
import numpy as np
import time
import asyncio

from database import get_db, init_db
from models import User, SignalLog, BluetoothScan, WifiScan, PentestSession, WifiAttackResult
from wifi_tools import wifi_tools
from shell_executor import shell_executor
from evil_twin import evil_twin_manager

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
    title="PocketGone Pentesting Platform API",
    description="WiFi Penetration Testing Platform with Kali Linux Tools Integration - Educational Use Only",
    version="2.0.0",
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

# New schemas for pentesting functionality
class WifiInterfaceResponse(BaseModel):
    name: str
    mac: str
    monitor_mode: bool
    status: str

class MonitorModeRequest(BaseModel):
    interface: str
    enable: bool

class NetworkScanRequest(BaseModel):
    interface: str
    duration: int = 10

class DeauthAttackRequest(BaseModel):
    interface: str
    target_bssid: str
    client_mac: Optional[str] = None
    count: int = 10

class HandshakeCaptureRequest(BaseModel):
    interface: str
    target_bssid: str
    channel: str
    duration: int = 60

class WPSAttackRequest(BaseModel):
    interface: str
    target_bssid: str
    channel: str

class WifiteAttackRequest(BaseModel):
    interface: str
    target_bssid: Optional[str] = None

class SessionStatusResponse(BaseModel):
    session_id: str
    status: str
    tool_name: Optional[str] = None
    pid: Optional[int] = None

class ToolsAvailabilityResponse(BaseModel):
    tools: dict
    interfaces: List[WifiInterfaceResponse]

class TerminalResizeRequest(BaseModel):
    cols: int
    rows: int

class TerminalInputRequest(BaseModel):
    data: str

class CommandExecuteRequest(BaseModel):
    command: str
    user: str = "root"
    timeout: int = 30

class EvilTwinRequest(BaseModel):
    interface: str
    ssid: str
    channel: int
    target_mac: Optional[str] = None

class CaptivePortalRequest(BaseModel):
    interface: str
    ssid: str
    channel: int
    portal_type: str = "google"  # google, facebook, generic

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
# PENTESTING TOOLS ENDPOINTS  
# ============================================================================

@app.get("/api/pentest/tools", response_model=ToolsAvailabilityResponse)
async def get_tools_availability():
    """Get available pentesting tools and wireless interfaces"""
    interfaces = wifi_tools.get_wireless_interfaces()
    return ToolsAvailabilityResponse(
        tools=wifi_tools.tools_available,
        interfaces=[WifiInterfaceResponse(**iface) for iface in interfaces]
    )

@app.post("/api/pentest/monitor-mode")
async def toggle_monitor_mode(request: MonitorModeRequest):
    """Enable or disable monitor mode on wireless interface"""
    if request.enable:
        success, message = await wifi_tools.enable_monitor_mode(request.interface)
    else:
        success, message = await wifi_tools.disable_monitor_mode(request.interface)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {"success": True, "message": message, "interface": message if request.enable else request.interface}

@app.post("/api/pentest/scan-networks")
async def scan_wifi_networks(request: NetworkScanRequest):
    """Scan for WiFi networks using airodump-ng"""
    networks = await wifi_tools.scan_networks(request.interface, request.duration)
    return {"networks": networks, "count": len(networks)}

@app.post("/api/pentest/deauth-attack")
async def deauth_attack(request: DeauthAttackRequest, db: Session = Depends(get_db)):
    """Perform WiFi deauthentication attack"""
    success, output = await wifi_tools.deauth_attack(
        request.interface,
        request.target_bssid,
        request.client_mac,
        request.count
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=output)
    
    # Log attack in database
    try:
        attack_result = WifiAttackResult(
            session_id=f"deauth_{int(time.time())}",
            attack_type="deauth",
            target_bssid=request.target_bssid,
            success=success,
            notes=output
        )
        db.add(attack_result)
        db.commit()
    except SQLAlchemyError as e:
        print(f"Error logging attack: {e}")
        db.rollback()
    
    return {"success": True, "output": output}

@app.post("/api/pentest/capture-handshake")
async def capture_handshake(request: HandshakeCaptureRequest, db: Session = Depends(get_db)):
    """Capture WPA handshake"""
    output_file = f"/tmp/handshake_{request.target_bssid.replace(':', '')}_{int(time.time())}"
    
    success, message = await wifi_tools.capture_handshake(
        request.interface,
        request.target_bssid,
        request.channel,
        output_file,
        request.duration
    )
    
    # Log capture attempt
    try:
        attack_result = WifiAttackResult(
            session_id=f"handshake_{int(time.time())}",
            attack_type="handshake",
            target_bssid=request.target_bssid,
            success=success,
            handshake_captured=success,
            handshake_file=output_file if success else None,
            notes=message
        )
        db.add(attack_result)
        db.commit()
    except SQLAlchemyError as e:
        print(f"Error logging capture: {e}")
        db.rollback()
    
    return {"success": success, "message": message, "file": output_file if success else None}

@app.post("/api/pentest/wps-attack")
async def wps_attack(request: WPSAttackRequest, db: Session = Depends(get_db)):
    """Start WPS attack using Reaver"""
    success, message, session_id = await wifi_tools.wps_attack_reaver(
        request.interface,
        request.target_bssid,
        request.channel
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # Log session in database
    try:
        pentest_session = PentestSession(
            session_id=session_id,
            tool_name="reaver",
            interface=request.interface,
            target_bssid=request.target_bssid,
            status="running",
            command=f"reaver -i {request.interface} -b {request.target_bssid} -c {request.channel}"
        )
        db.add(pentest_session)
        db.commit()
    except SQLAlchemyError as e:
        print(f"Error logging session: {e}")
        db.rollback()
    
    return {"success": True, "message": message, "session_id": session_id}

@app.post("/api/pentest/wifite-attack")
async def wifite_attack(request: WifiteAttackRequest, db: Session = Depends(get_db)):
    """Start automated Wifite attack"""
    success, message, session_id = await wifi_tools.run_wifite(
        request.interface,
        request.target_bssid
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # Log session in database
    try:
        pentest_session = PentestSession(
            session_id=session_id,
            tool_name="wifite",
            interface=request.interface,
            target_bssid=request.target_bssid,
            status="running",
            command=f"wifite -i {request.interface}"
        )
        db.add(pentest_session)
        db.commit()
    except SQLAlchemyError as e:
        print(f"Error logging session: {e}")
        db.rollback()
    
    return {"success": True, "message": message, "session_id": session_id}

@app.post("/api/pentest/stop-session/{session_id}")
async def stop_pentest_session(session_id: str, db: Session = Depends(get_db)):
    """Stop an active pentesting session"""
    success, message = await wifi_tools.stop_session(session_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=message)
    
    # Update session in database
    try:
        session = db.query(PentestSession).filter(PentestSession.session_id == session_id).first()
        if session:
            session.status = "stopped"
            session.ended_at = datetime.now()
            db.commit()
    except SQLAlchemyError as e:
        print(f"Error updating session: {e}")
        db.rollback()
    
    return {"success": True, "message": message}

@app.get("/api/pentest/session-status/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(session_id: str, db: Session = Depends(get_db)):
    """Get status of a pentesting session"""
    status = wifi_tools.get_session_status(session_id)
    
    # Get from database
    try:
        session = db.query(PentestSession).filter(PentestSession.session_id == session_id).first()
        if session:
            return SessionStatusResponse(
                session_id=session_id,
                status=session.status,
                tool_name=session.tool_name,
                pid=session.pid
            )
    except SQLAlchemyError:
        pass
    
    return SessionStatusResponse(
        session_id=session_id,
        status=status.get('status', 'unknown'),
        pid=status.get('pid')
    )

@app.get("/api/pentest/attack-history")
async def get_attack_history(limit: int = 50, db: Session = Depends(get_db)):
    """Get history of WiFi attacks"""
    try:
        attacks = db.query(WifiAttackResult).order_by(
            WifiAttackResult.created_at.desc()
        ).limit(limit).all()
        
        return {
            "attacks": [
                {
                    "id": attack.id,
                    "session_id": attack.session_id,
                    "attack_type": attack.attack_type,
                    "target_bssid": attack.target_bssid,
                    "target_ssid": attack.target_ssid,
                    "success": attack.success,
                    "handshake_captured": attack.handshake_captured,
                    "handshake_file": attack.handshake_file,
                    "wps_pin": attack.wps_pin,
                    "password": attack.password,
                    "notes": attack.notes,
                    "created_at": attack.created_at.isoformat() if attack.created_at else None
                }
                for attack in attacks
            ]
        }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/pentest/{session_id}")
async def websocket_pentest_output(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time pentesting tool output"""
    await websocket.accept()
    
    try:
        # Check if session exists
        if session_id not in wifi_tools.active_sessions:
            await websocket.send_json({"error": "Session not found"})
            await websocket.close()
            return
        
        process = wifi_tools.active_sessions[session_id]
        
        # Stream output
        while process.returncode is None:
            try:
                # Read stdout
                if process.stdout:
                    line = await asyncio.wait_for(process.stdout.readline(), timeout=0.1)
                    if line:
                        await websocket.send_json({"type": "stdout", "data": line.decode()})
                
                # Read stderr
                if process.stderr:
                    line = await asyncio.wait_for(process.stderr.readline(), timeout=0.1)
                    if line:
                        await websocket.send_json({"type": "stderr", "data": line.decode()})
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                await websocket.send_json({"type": "error", "data": str(e)})
                break
        
        await websocket.send_json({"type": "completed", "returncode": process.returncode})
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "data": str(e)})
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass

# ============================================================================
# WEB TERMINAL ENDPOINTS
# ============================================================================

@app.post("/api/terminal/create")
async def create_terminal(user: str = "root"):
    """Create a new terminal session"""
    try:
        session_id = await shell_executor.create_terminal(user=user)
        return {"success": True, "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/terminal/{session_id}/input")
async def terminal_input(session_id: str, request: TerminalInputRequest):
    """Send input to terminal session"""
    terminal = shell_executor.get_terminal(session_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal session not found")
    
    await terminal.write(request.data)
    return {"success": True}

@app.post("/api/terminal/{session_id}/resize")
async def terminal_resize(session_id: str, request: TerminalResizeRequest):
    """Resize terminal window"""
    terminal = shell_executor.get_terminal(session_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal session not found")
    
    terminal.resize(request.cols, request.rows)
    return {"success": True}

@app.delete("/api/terminal/{session_id}")
async def close_terminal(session_id: str):
    """Close terminal session"""
    success = await shell_executor.close_terminal(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Terminal session not found")
    return {"success": True}

@app.websocket("/ws/terminal/{session_id}")
async def websocket_terminal(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for terminal I/O"""
    await websocket.accept()
    
    terminal = shell_executor.get_terminal(session_id)
    if not terminal:
        await websocket.send_json({"error": "Terminal session not found"})
        await websocket.close()
        return
    
    try:
        while terminal.is_alive():
            # Read from terminal
            output = await terminal.read(timeout=0.1)
            if output:
                await websocket.send_json({"type": "output", "data": output})
            
            # Check for incoming messages (with timeout)
            try:
                message = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                if message.get("type") == "input":
                    await terminal.write(message.get("data", ""))
                elif message.get("type") == "resize":
                    terminal.resize(message.get("cols", 80), message.get("rows", 24))
            except asyncio.TimeoutError:
                continue
            except WebSocketDisconnect:
                break
        
        await websocket.send_json({"type": "closed"})
    except Exception as e:
        print(f"Terminal WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

@app.post("/api/terminal/execute")
async def execute_command(request: CommandExecuteRequest):
    """Execute a single command"""
    result = await shell_executor.execute_command(
        request.command,
        user=request.user,
        timeout=request.timeout
    )
    return result

@app.post("/api/terminal/airgeddon")
async def launch_airgeddon(interface: str):
    """Launch Airgeddon tool"""
    session_id = await shell_executor.execute_airgeddon(interface)
    if not session_id:
        raise HTTPException(status_code=500, detail="Failed to launch Airgeddon")
    return {"success": True, "session_id": session_id}

# ============================================================================
# EVIL TWIN / CAPTIVE PORTAL ENDPOINTS
# ============================================================================

@app.post("/api/evil-twin/create")
async def create_evil_twin(request: EvilTwinRequest):
    """Create an evil twin access point"""
    success, message, ap_id = await evil_twin_manager.create_evil_twin(
        request.interface,
        request.ssid,
        request.channel,
        request.target_mac
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {"success": True, "message": message, "ap_id": ap_id}

@app.post("/api/captive-portal/create")
async def create_captive_portal(request: CaptivePortalRequest):
    """Create a captive portal"""
    success, message, ap_id = await evil_twin_manager.create_captive_portal(
        request.interface,
        request.ssid,
        request.channel,
        request.portal_type
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {"success": True, "message": message, "ap_id": ap_id}

@app.delete("/api/evil-twin/{ap_id}")
async def stop_evil_twin(ap_id: str):
    """Stop an evil twin or captive portal"""
    success, message = await evil_twin_manager.stop_ap(ap_id)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"success": True, "message": message}

@app.get("/api/evil-twin/{ap_id}/info")
async def get_evil_twin_info(ap_id: str):
    """Get information about an evil twin AP"""
    info = evil_twin_manager.get_ap_info(ap_id)
    if not info:
        raise HTTPException(status_code=404, detail="AP not found")
    
    # Remove process objects from response
    safe_info = {k: v for k, v in info.items() if not k.endswith('_process')}
    return safe_info

@app.get("/api/captive-portal/{ap_id}/credentials")
async def get_captured_credentials(ap_id: str):
    """Get credentials captured by captive portal"""
    credentials = evil_twin_manager.get_captured_credentials(ap_id)
    return {"ap_id": ap_id, "credentials": credentials, "count": len(credentials)}

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "online",
        "service": "PocketGone Pentesting Platform",
        "version": "2.0.0",
        "message": "WiFi Penetration Testing Platform - Educational Use Only",
        "warning": "⚠️ For authorized educational use in controlled lab environments only"
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
