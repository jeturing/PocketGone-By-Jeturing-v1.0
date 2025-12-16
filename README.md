<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PocketGone By Jeturing v2.0

**WiFi Penetration Testing Platform for Educational Use**

A comprehensive web-based platform for WiFi security testing and penetration testing education. Integrates real Kali Linux tools through a modern web interface for controlled laboratory environments.

⚠️ **WARNING**: This platform contains real penetration testing capabilities. For authorized educational use only in controlled lab environments at ITLA EDU university cybersecurity classes.

## 🎓 Educational Purpose

This platform is designed for:
- **Cybersecurity Education**: Teaching WiFi security concepts and vulnerabilities
- **Penetration Testing Training**: Hands-on experience with industry-standard tools
- **Controlled Lab Environments**: Safe, isolated testing environments
- **Authorized Testing Only**: All activities require explicit authorization

## 🔥 Core Features

### Real WiFi Penetration Testing
- **Network Scanning**: Live WiFi network discovery using airodump-ng
- **Monitor Mode**: Interface management with airmon-ng
- **Deauthentication Attacks**: Client disconnection using aireplay-ng
- **WPA Handshake Capture**: Automated handshake capture for WPA/WPA2
- **WPS Attacks**: PIN attacks using Reaver
- **Automated Attacks**: Full automation with Wifite
- **Evil Twin APs**: Rogue access point creation
- **Captive Portals**: Credential phishing with customizable templates

### Interactive Web Terminal
- **Root Shell Access**: Direct root terminal access via web browser
- **Real-time I/O**: WebSocket-based terminal streaming
- **Multiple Sessions**: Support for concurrent terminal sessions
- **Tool Integration**: Launch Airgeddon and other CLI tools
- **Privilege Management**: Root or user-level execution

### Attack Management
- **Session Tracking**: Monitor active penetration testing sessions
- **Attack History**: Database logging of all attacks
- **Real-time Output**: Live streaming of tool output
- **Process Control**: Start, stop, and monitor attack processes
- **Result Storage**: Automatic capture of handshakes and credentials

### Interface Detection
- **Auto-Discovery**: Automatic wireless interface detection
- **Monitor Mode Status**: Real-time monitoring of interface modes
- **MAC Address Info**: Interface hardware information
- **Multi-Interface**: Support for multiple wireless adapters

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19.2.1 with TypeScript
- **Build Tool**: Vite 6.2.0
- **UI Library**: Custom components with Lucide icons
- **Terminal Emulator**: xterm.js (to be integrated)
- **WebSocket**: Real-time bidirectional communication

### Backend (Python + FastAPI)
- **Framework**: FastAPI with async support
- **WebSocket**: Real-time bidirectional communication
- **Database**: SQLAlchemy with SQLite
- **Process Management**: Asyncio subprocess control
- **Tool Integration**: Direct OS command execution
- **Privilege Management**: Root/user execution control

### Kali Linux Tools Integrated
- **aircrack-ng suite**: airmon-ng, airodump-ng, aireplay-ng
- **Wifite**: Automated WiFi auditing
- **Reaver**: WPS PIN attacks
- **Hostapd**: Rogue AP creation
- **Dnsmasq**: DHCP/DNS services
- **Airgeddon**: Comprehensive WiFi auditing (launcher)

### Database Schema
- **Users**: Root/student authentication with system user mapping
- **PentestSessions**: Active tool execution tracking
- **WifiAttackResults**: Attack history and results
- **SignalLogs**: RF captures (legacy)
- **BluetoothScans/WifiScans**: Device discovery logs

## 📋 Prerequisites

### System Requirements
- **OS**: Kali Linux or Debian-based Linux with pentesting tools
- **Hardware**: Wireless adapter capable of monitor mode
- **Privileges**: Root access required for pentesting operations
- **Python**: 3.9 or higher
- **Node.js**: v18 or higher

### Required Packages (Kali Linux)
```bash
sudo apt update
sudo apt install -y aircrack-ng wifite reaver hostapd dnsmasq python3-pip nodejs npm
```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jcarvajalantigua/PocketGone-By-Jeturing-v1.0.git
cd PocketGone-By-Jeturing-v1.0
```

### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server (as root for pentesting features)
sudo python main.py
```

The backend server will start at `http://localhost:8000`

⚠️ **Note**: Running as root is required for:
- Monitor mode operations
- Packet injection
- Network interface manipulation
- Rogue AP creation

### 3. Frontend Setup

```bash
# In a new terminal, navigate to project root
cd PocketGone-By-Jeturing-v1.0

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start at `http://localhost:5173`

## 🎮 Usage

### Login Credentials

The platform uses system-level authentication:

- **Administrator (Root Access)**
  - Username: `root`
  - Password: `toor`
  - Privileges: Full system access, all tools enabled

- **Student (User Access)**
  - Username: `student`
  - Password: `student`
  - Privileges: Limited access, supervised operations

### Workflow Examples

#### 1. WiFi Network Scanning
```bash
1. Login as root
2. Navigate to Pentesting Tools section
3. Select wireless interface (e.g., wlan0)
4. Enable monitor mode
5. Click "Scan Networks"
6. View discovered networks with details
```

#### 2. WPA Handshake Capture
```bash
1. Scan for target network
2. Note BSSID and channel
3. Start handshake capture
4. (Optional) Perform deauth attack to force reconnection
5. Wait for handshake capture
6. Handshake saved to /tmp/ directory
```

#### 3. Evil Twin Attack
```bash
1. Scan for target network
2. Create evil twin with same SSID
3. Select captive portal template (Google/Facebook/Generic)
4. Launch evil twin AP
5. Monitor credential captures in real-time
```

#### 4. Automated Attack (Wifite)
```bash
1. Enable monitor mode on interface
2. Launch Wifite attack
3. Select target or scan all networks
4. Monitor progress via WebSocket output
5. Results saved automatically
```

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

For complete interactive API documentation, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Authentication Endpoints

#### POST `/api/auth/login`
Login with root or student credentials
```json
{
  "access_code": "toor"
}
```

### Pentesting Tool Endpoints

#### GET `/api/pentest/tools`
Check available tools and wireless interfaces

#### POST `/api/pentest/monitor-mode`
Enable/disable monitor mode on interface
```json
{
  "interface": "wlan0",
  "enable": true
}
```

#### POST `/api/pentest/scan-networks`
Scan for WiFi networks using airodump-ng
```json
{
  "interface": "wlan0mon",
  "duration": 10
}
```

#### POST `/api/pentest/deauth-attack`
Perform deauthentication attack
```json
{
  "interface": "wlan0mon",
  "target_bssid": "AA:BB:CC:DD:EE:FF",
  "client_mac": "11:22:33:44:55:66",
  "count": 10
}
```

#### POST `/api/pentest/capture-handshake`
Capture WPA handshake
```json
{
  "interface": "wlan0mon",
  "target_bssid": "AA:BB:CC:DD:EE:FF",
  "channel": "6",
  "duration": 60
}
```

#### POST `/api/pentest/wps-attack`
Start Reaver WPS attack
```json
{
  "interface": "wlan0mon",
  "target_bssid": "AA:BB:CC:DD:EE:FF",
  "channel": "6"
}
```

#### POST `/api/pentest/wifite-attack`
Launch Wifite automated attack
```json
{
  "interface": "wlan0mon",
  "target_bssid": "AA:BB:CC:DD:EE:FF"
}
```

#### GET `/api/pentest/attack-history`
Retrieve attack history and results

#### WebSocket `/ws/pentest/{session_id}`
Real-time output streaming for active attacks

### Terminal Endpoints

#### POST `/api/terminal/create`
Create new terminal session with root or user privileges

#### POST `/api/terminal/{id}/input`
Send input to terminal session

#### DELETE `/api/terminal/{id}`
Close terminal session

#### WebSocket `/ws/terminal/{id}`
Real-time terminal I/O streaming

#### POST `/api/terminal/execute`
Execute single command
```json
{
  "command": "iwconfig",
  "user": "root",
  "timeout": 30
}
```

#### POST `/api/terminal/airgeddon`
Launch Airgeddon tool
```json
{
  "interface": "wlan0"
}
```

### Evil Twin / Captive Portal Endpoints

#### POST `/api/evil-twin/create`
Create rogue access point
```json
{
  "interface": "wlan0",
  "ssid": "Free WiFi",
  "channel": 6,
  "target_mac": "AA:BB:CC:DD:EE:FF"
}
```

#### POST `/api/captive-portal/create`
Create captive portal with credential phishing
```json
{
  "interface": "wlan0",
  "ssid": "Airport WiFi",
  "channel": 6,
  "portal_type": "google"
}
```

#### GET `/api/captive-portal/{id}/credentials`
Retrieve captured credentials

#### DELETE `/api/evil-twin/{id}`
Stop rogue AP or captive portal

### Legacy Endpoints (RF Spectrum)

#### GET `/api/fft/live`
Get simulated RF spectrum data

#### GET `/api/bt/scan`
Simulated Bluetooth device scan

#### GET `/api/wifi/scan`
Simulated WiFi network scan

#### GET `/`
API status check

#### GET `/health`
Detailed health check

For complete API documentation, visit: `http://localhost:8000/docs` (Swagger UI)

## 🗄️ Database

The application uses SQLite for data persistence. The database file is located at:
```
./data/pocketgone.db
```

### Tables
- `users` - Root/student authentication with system user mapping
- `pentest_sessions` - Active penetration testing tool sessions
- `wifi_attack_results` - Attack history and captured credentials
- `signal_logs` - RF signal captures (legacy)
- `bluetooth_scans` - Bluetooth device history (legacy)
- `wifi_scans` - WiFi network history (legacy)

## 🔐 Security Considerations

### ⚠️ CRITICAL WARNINGS

**This platform contains real penetration testing capabilities:**

1. **Legal Requirements**:
   - Only use on networks you own or have explicit written authorization to test
   - Unauthorized access to computer networks is illegal in most jurisdictions
   - Educational use does not exempt from legal requirements

2. **Ethical Guidelines**:
   - Always obtain written permission before testing
   - Document all testing activities
   - Report findings responsibly
   - Never use for malicious purposes

3. **Technical Security**:
   - Platform runs with root privileges
   - No authentication required for tool execution after login
   - Credential capture functionality is active
   - Network interfaces are manipulated at system level
   - Iptables rules are modified

4. **Deployment Security**:
   - Deploy only on isolated lab networks
   - Never expose to the internet
   - Use firewall rules to restrict access
   - Monitor all activities
   - Regular security audits recommended

5. **Educational Use Only**:
   - Designed for ITLA EDU cybersecurity curriculum
   - Supervised use by qualified instructors
   - Controlled laboratory environment
   - Student agreement forms required

### Root Access

The platform requires root access for:
- Monitor mode operations (airmon-ng)
- Packet injection (aireplay-ng)
- Network interface manipulation
- Hostapd (rogue AP creation)
- Dnsmasq (DHCP/DNS services)
- Iptables configuration

### Data Protection

- Captured handshakes stored in `/tmp/` directory
- Credentials logged in database and portal directories
- All attack history maintained in database
- Regular cleanup recommended

## 🛠️ Troubleshooting

### Common Issues

**Interface not found:**
```bash
# Check available interfaces
iwconfig
ip link show

# Check if interface supports monitor mode
iw list | grep "Supported interface modes" -A 10
```

**Monitor mode fails:**
```bash
# Kill interfering processes
sudo airmon-ng check kill

# Manually enable monitor mode
sudo ip link set wlan0 down
sudo iw dev wlan0 set type monitor
sudo ip link set wlan0 up
```

**Permission denied:**
```bash
# Ensure running as root
sudo python backend/main.py
```

**No tools available:**
```bash
# Install missing tools on Kali Linux
sudo apt install -y aircrack-ng wifite reaver hostapd dnsmasq

# Verify installation
which airmon-ng airodump-ng wifite reaver
```

**WebSocket connection fails:**
- Check firewall rules
- Verify CORS configuration in backend/main.py
- Check browser console for errors

## 📚 Educational Resources

### Recommended Prerequisites

Students should understand:
- Basic networking concepts (TCP/IP, DNS, DHCP)
- WiFi protocols (802.11, WPA/WPA2/WPA3)
- Linux command line basics
- Ethical hacking principles
- Legal implications of security testing

### Learning Path

1. **Module 1**: Wireless Fundamentals
   - WiFi standards and protocols
   - Authentication mechanisms
   - Encryption methods

2. **Module 2**: Reconnaissance
   - Interface management
   - Monitor mode operations
   - Network scanning techniques

3. **Module 3**: Attack Techniques
   - Deauthentication attacks
   - Handshake capture
   - WPS vulnerabilities
   - Evil twin attacks

4. **Module 4**: Defense
   - Detecting rogue APs
   - Monitoring for attacks
   - Implementing WPA3
   - Network segmentation

## 🔧 Development

### Project Structure

```
PocketGone-By-Jeturing-v1.0/
├── backend/
│   ├── main.py                 # FastAPI application (800+ lines)
│   ├── wifi_tools.py           # WiFi pentesting tools wrapper (450+ lines)
│   ├── shell_executor.py       # Terminal/shell execution (300+ lines)
│   ├── evil_twin.py            # Evil twin & captive portal (500+ lines)
│   ├── models.py               # Database models
│   ├── database.py             # Database configuration
│   ├── requirements.txt        # Python dependencies
│   └── start.sh                # Quick start script
├── components/
│   ├── SpectrumDisplay.tsx     # RF visualization
│   ├── BluetoothView.tsx       # Bluetooth interface
│   ├── WifiView.tsx            # WiFi interface
│   └── ...                     # Other React components
├── services/
│   ├── rfService.ts            # RF data service
│   └── authService.ts          # Authentication
├── App.tsx                     # Main application
├── types.ts                    # TypeScript types
├── package.json                # Node dependencies
└── README.md                   # This file
```

### Adding New Tools

To integrate additional tools:

1. Add tool wrapper in `wifi_tools.py` or create new module
2. Add API endpoints in `main.py`
3. Update frontend components
4. Add tool availability check
5. Document in README

## 📖 References

### Official Tool Documentation

- [Aircrack-ng](https://www.aircrack-ng.org/)
- [Wifite](https://github.com/derv82/wifite2)
- [Reaver](https://github.com/t6x/reaver-wps-fork-t6x)
- [Hostapd](https://w1.fi/hostapd/)

### Learning Resources

- [Kali Linux Documentation](https://www.kali.org/docs/)
- [OWASP WiFi Security](https://owasp.org/www-community/controls/Wireless_Security)
- [WiFi Pentesting Guide](https://github.com/s0md3v/Awesome-WiFi-Hacking)

## 🤝 Contributing

Contributions are welcome! Please:
- Follow existing code style
- Add tests for new features
- Update documentation
- Submit pull requests with clear descriptions

## 📄 License

This project is licensed for educational use at ITLA EDU university.

**Terms:**
- Educational purposes only
- No commercial use
- No malicious use
- Proper attribution required
- Instructor supervision required

## 👥 Authors

- **Jeturing Team** - Initial development
- **jcarvajalantigua** - Pentesting platform transformation
- **ITLA EDU** - Educational institution sponsor

## 🔗 Links

- **GitHub Repository**: https://github.com/jcarvajalantigua/PocketGone-By-Jeturing-v1.0
- **ITLA EDU**: Instituto Tecnológico de Las Américas

## 📞 Support

For questions or support:
- Open an issue in the GitHub repository
- Contact ITLA EDU cybersecurity department
- Review documentation at `/docs` endpoint

## ⚖️ Legal Disclaimer

**IMPORTANT**: This tool is provided for educational purposes only. The authors and ITLA EDU are not responsible for any misuse or damage caused by this platform. Users must:

1. Obtain proper authorization before testing
2. Comply with all applicable laws and regulations
3. Use only in controlled educational environments
4. Accept full responsibility for their actions
5. Never use for unauthorized access

By using this platform, you agree to use it responsibly and ethically in accordance with all applicable laws and only with explicit authorization.

---

**Built for cybersecurity education at ITLA EDU** 🎓🔒

