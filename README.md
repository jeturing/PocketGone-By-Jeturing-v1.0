<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PocketGone By Jeturing v1.0

**RF Spectrum Analysis, Bluetooth Diagnostics (Modo S), and WiFi Lab**

An educational web laboratory for learning RF spectrum analysis, Bluetooth device diagnostics, and WiFi network monitoring. This application provides an interactive environment for students and professors to explore wireless communications, signal processing, and network security concepts.

## 🎓 Features

### RF Spectrum Analyzer
- **Real-time FFT Visualization**: Monitor RF spectrum in multiple frequency bands (FM Radio, 2.4 GHz, 5 GHz)
- **Configurable Parameters**: Adjust center frequency, bandwidth, sample rate, and gain
- **Signal Capture**: Capture and log interesting signals for later analysis
- **Interactive Waterfall Display**: Visualize signal patterns over time

### Bluetooth Lab (Modo S)
- **Device Discovery**: Scan for nearby Bluetooth devices
- **Device Information**: View MAC addresses, signal strength (RSSI), Class of Device, and vendor info
- **Modo S Interference Generator**: Educational tool to demonstrate Bluetooth interference patterns
- **Connection Status**: Real-time monitoring of device connection states

### WiFi Monitor
- **Multi-Band Scanning**: Support for 2.4 GHz, 5 GHz, and 6 GHz bands
- **Network Details**: SSID, BSSID, channel, security type, vendor identification
- **Channel Visualization**: See channel utilization and overlap
- **Signal Strength Monitoring**: Track RSSI values across networks

### KPI Dashboard
- **System Statistics**: Monitor uptime, packets captured, threats blocked
- **Device Tracking**: Count of active devices across all modules
- **Resource Monitoring**: Storage usage and CPU temperature
- **Real-time Updates**: Live statistics from the backend

### Authentication System
- **Role-Based Access**: Separate access for students and professors
- **Session Management**: Secure session handling with localStorage
- **Access Codes**: Simple authentication for educational environments

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19.2.1 with TypeScript
- **Build Tool**: Vite 6.2.0
- **UI Library**: Custom components with Lucide icons
- **Visualization**: D3.js for spectrum analysis charts
- **State Management**: React hooks (useState, useEffect)

### Backend (Python + FastAPI)
- **Framework**: FastAPI 0.115.0
- **Server**: Uvicorn with ASGI
- **Database**: SQLAlchemy with SQLite
- **Data Generation**: NumPy for signal simulation
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

### Database Schema
- **Users**: Authentication and role management
- **Signal Logs**: Captured RF spectrum events
- **Bluetooth Scans**: Historical Bluetooth device discoveries
- **WiFi Scans**: Historical WiFi network observations

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jcarvajalantigua/PocketGone-By-Jeturing-v1.0.git
cd PocketGone-By-Jeturing-v1.0
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

The backend server will start at `http://localhost:8000`

### 3. Frontend Setup

```bash
# In a new terminal, navigate to project root
cd PocketGone-By-Jeturing-v1.0

# Install Node.js dependencies
npm install

# Set up environment variables (optional)
# Copy .env.local.example to .env.local and configure if needed
cp .env.local .env.local

# Start the development server
npm run dev
```

The frontend will start at `http://localhost:5173`

## 🎮 Usage

### Login Credentials

The application comes with two default accounts:

- **Professor Account**
  - Access Code: `admin`
  - Username: Prof. Falken
  - Role: PROFESSOR

- **Student Account**
  - Access Code: `student`
  - Username: Student Unit 1
  - Role: STUDENT

### Navigation

1. **Dashboard**: View system KPIs and overall statistics
2. **RF Spectrum**: Real-time spectrum analyzer with configurable parameters
3. **Bluetooth Lab**: Scan for Bluetooth devices and activate Modo S interference
4. **WiFi Monitor**: Scan and analyze WiFi networks across different bands
5. **Signal Logs**: Review captured signals and add notes
6. **System Settings**: View database configuration

### Modo S (Bluetooth Interference)

Modo S is an educational feature that simulates Bluetooth interference patterns:
- **Active Phase**: 60 seconds of interference generation at 2.4 GHz
- **Window Phase**: 10 seconds pause
- **Cycle**: Repeats automatically until manually stopped

**Warning**: Modo S generates simulated interference in the 2.4 GHz band for educational purposes.

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication Endpoints

#### POST `/api/auth/login`
Login with access code
```json
{
  "access_code": "admin"
}
```

### RF Spectrum Endpoints

#### GET `/api/fft/live`
Get live spectrum data
- Query params: `center_freq`, `bandwidth`, `points`, `modo_s`

### Bluetooth Endpoints

#### GET `/api/bt/scan`
Scan for Bluetooth devices

### WiFi Endpoints

#### GET `/api/wifi/scan`
Scan for WiFi networks
- Query param: `band` (2.4GHz, 5GHz, 6GHz)

### Signal Log Endpoints

#### POST `/api/logs`
Create a signal log entry

#### GET `/api/logs`
Retrieve all signal logs

#### DELETE `/api/logs/{log_id}`
Delete a specific log

### Statistics Endpoints

#### GET `/api/stats/kpi`
Get system KPI statistics

### Health Check

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
- `users` - User accounts and authentication
- `signal_logs` - Captured RF signals
- `bluetooth_scans` - Bluetooth device scan history
- `wifi_scans` - WiFi network scan history

## 📦 Project Structure

```
PocketGone-By-Jeturing-v1.0/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # Database configuration
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
├── components/
│   ├── SpectrumDisplay.tsx  # RF spectrum visualization
│   ├── BluetoothView.tsx    # Bluetooth scanning interface
│   ├── WifiView.tsx         # WiFi monitoring interface
│   ├── KpiDashboard.tsx     # Statistics dashboard
│   ├── ControlPanel.tsx     # RF parameter controls
│   ├── LogsView.tsx         # Signal logs viewer
│   └── Login.tsx            # Authentication component
├── services/
│   ├── rfService.ts         # RF data service
│   ├── authService.ts       # Authentication service
│   └── geminiService.ts     # AI service integration
├── App.tsx                  # Main application component
├── types.ts                 # TypeScript type definitions
├── package.json             # Node.js dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 🛠️ Development

### Building for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
The Python backend doesn't require a build step. For production deployment, consider:
- Using gunicorn or uvicorn with multiple workers
- Setting up proper CORS origins in environment variables
- Using a production-grade database (PostgreSQL)
- Implementing proper authentication with JWT tokens

### Running Tests

```bash
# Frontend tests (if implemented)
npm test

# Backend tests (if implemented)
python -m pytest
```

## 🔐 Security Notes

This application is designed for **educational purposes** and includes simplified authentication:
- Access codes are stored in the database for demo purposes
- In production, implement proper password hashing
- Use environment variables for sensitive configuration
- Implement JWT tokens for session management
- Add rate limiting for API endpoints
- Use HTTPS in production environments

## 📚 Educational Use

This application is designed as an educational tool for:
- Wireless communications courses
- Network security labs
- Signal processing demonstrations
- RF engineering education
- IoT device discovery and analysis

**Note**: All RF data, Bluetooth scans, and WiFi networks are simulated for educational purposes. In a real implementation, you would integrate with actual SDR hardware (e.g., RTL-SDR, HackRF) and system Bluetooth/WiFi APIs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is licensed for educational use.

## 👥 Authors

- **Jeturing Team** - Initial development
- **jcarvajalantigua** - Repository maintenance

## 🔗 Links

- **AI Studio App**: https://ai.studio/apps/drive/1CchDrrrbQnNvMkosQ4o2-11TpxtxLfap
- **GitHub Repository**: https://github.com/jcarvajalantigua/PocketGone-By-Jeturing-v1.0

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ for RF and wireless communications education**

