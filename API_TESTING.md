# PocketGone API Testing Guide

This document provides example API requests for testing the PocketGone Backend API.

## Prerequisites

Start the backend server:
```bash
cd backend
python main.py
```

The API will be available at: `http://localhost:8000`

## Health Check

### Root Endpoint
```bash
curl http://localhost:8000/
```

Expected Response:
```json
{
  "status": "online",
  "service": "PocketGone Backend API",
  "version": "1.0.0",
  "message": "RF Spectrum Analysis, Bluetooth Diagnostics, and WiFi Lab"
}
```

### Health Check
```bash
curl http://localhost:8000/health
```

## Authentication

### Login with Professor Account
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"access_code": "admin"}'
```

Expected Response:
```json
{
  "username": "Prof. Falken",
  "role": "PROFESSOR",
  "is_authenticated": true,
  "onboarding_complete": true
}
```

### Login with Student Account
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"access_code": "student"}'
```

Expected Response:
```json
{
  "username": "Student Unit 1",
  "role": "STUDENT",
  "is_authenticated": true,
  "onboarding_complete": true
}
```

### Invalid Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"access_code": "invalid"}'
```

Expected Response: 401 Unauthorized

## RF Spectrum

### Get Live Spectrum Data (Default)
```bash
curl "http://localhost:8000/api/fft/live"
```

### Get Live Spectrum with Parameters
```bash
curl "http://localhost:8000/api/fft/live?center_freq=2440&bandwidth=80&points=256&modo_s=true"
```

Example Response:
```json
{
  "points": [
    {"frequency": 2400.0, "db": -85.3},
    {"frequency": 2400.3125, "db": -82.1},
    ...
  ],
  "timestamp": 1734338765000,
  "config": {
    "centerFreq": 2440,
    "bandwidth": 80,
    "points": 256
  }
}
```

### Common Frequency Bands

FM Radio:
```bash
curl "http://localhost:8000/api/fft/live?center_freq=98.5&bandwidth=2.0&points=128"
```

2.4 GHz WiFi/Bluetooth:
```bash
curl "http://localhost:8000/api/fft/live?center_freq=2440&bandwidth=83&points=256"
```

5 GHz WiFi:
```bash
curl "http://localhost:8000/api/fft/live?center_freq=5500&bandwidth=200&points=512"
```

## Bluetooth

### Scan for Bluetooth Devices
```bash
curl http://localhost:8000/api/bt/scan
```

Example Response:
```json
[
  {
    "mac": "A0:EF:4A:83:86:88",
    "name": "JBL Flip 5",
    "rssi": -64,
    "cod": "Audio/Video",
    "vendor": "JBL",
    "lastSeen": 1734338765000,
    "isConnected": true
  }
]
```

## WiFi

### Scan 2.4 GHz Band
```bash
curl "http://localhost:8000/api/wifi/scan?band=2.4GHz"
```

### Scan 5 GHz Band
```bash
curl "http://localhost:8000/api/wifi/scan?band=5GHz"
```

### Scan 6 GHz Band
```bash
curl "http://localhost:8000/api/wifi/scan?band=6GHz"
```

Example Response:
```json
[
  {
    "ssid": "Campus_Guest",
    "bssid": "AA:BB:CC:DD:EE:01",
    "channel": 1,
    "rssi": -55,
    "security": "WPA2",
    "vendor": "Cisco",
    "band": "2.4GHz",
    "width": 20
  }
]
```

## Signal Logs

### Create Signal Log
```bash
curl -X POST http://localhost:8000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1734338765000,
    "frequency": 98.5,
    "bandwidth": 2.0,
    "peakDb": -42.5,
    "notes": "Strong FM station detected"
  }'
```

### Get All Signal Logs
```bash
curl http://localhost:8000/api/logs
```

### Get Limited Signal Logs
```bash
curl "http://localhost:8000/api/logs?limit=10"
```

### Delete Signal Log
```bash
curl -X DELETE http://localhost:8000/api/logs/550e8400-e29b-41d4-a716-446655440000
```

## Statistics

### Get KPI Statistics
```bash
curl http://localhost:8000/api/stats/kpi
```

Example Response:
```json
{
  "uptimeSeconds": 12450,
  "packetsCaptured": 1048576,
  "threatsBlocked": 23,
  "activeDevices": 42,
  "storageUsagePercent": 65,
  "cpuTemp": 48
}
```

## Interactive API Documentation

For interactive API testing, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide a web interface for testing all endpoints with built-in request/response examples.

## Using Python Requests

```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/api/auth/login',
    json={'access_code': 'admin'}
)
user = response.json()
print(f"Logged in as: {user['username']}")

# Get Spectrum Data
response = requests.get(
    'http://localhost:8000/api/fft/live',
    params={
        'center_freq': 2440,
        'bandwidth': 80,
        'points': 256
    }
)
spectrum = response.json()
print(f"Got {len(spectrum['points'])} spectrum points")

# Scan Bluetooth
response = requests.get('http://localhost:8000/api/bt/scan')
devices = response.json()
print(f"Found {len(devices)} Bluetooth devices")
```

## Using JavaScript Fetch

```javascript
// Login
const login = async () => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: 'student' })
  });
  const user = await response.json();
  console.log('Logged in as:', user.username);
};

// Get Spectrum Data
const getSpectrum = async () => {
  const response = await fetch(
    'http://localhost:8000/api/fft/live?center_freq=98.5&bandwidth=2.0'
  );
  const data = await response.json();
  console.log('Spectrum points:', data.points.length);
};

// Scan WiFi
const scanWifi = async () => {
  const response = await fetch(
    'http://localhost:8000/api/wifi/scan?band=5GHz'
  );
  const networks = await response.json();
  console.log('WiFi networks found:', networks.length);
};
```

## Error Handling

### 401 Unauthorized
```json
{
  "detail": "Invalid access code"
}
```

### 404 Not Found
```json
{
  "detail": "Log not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "access_code"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Performance Testing

### Load Test with Apache Bench
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:8000/health

# Test spectrum endpoint
ab -n 100 -c 5 "http://localhost:8000/api/fft/live"
```

### Load Test with curl in loop
```bash
# Simple benchmark
for i in {1..100}; do
  curl -s http://localhost:8000/api/bt/scan > /dev/null
  echo "Request $i completed"
done
```

## Troubleshooting

### Connection Refused
- Ensure backend server is running: `python backend/main.py`
- Check if port 8000 is available: `lsof -i :8000`

### CORS Errors
- Frontend must be running on `http://localhost:5173` or `http://localhost:3000`
- Check CORS settings in `backend/main.py`

### Database Errors
- Delete database file: `rm data/pocketgone.db`
- Restart server to recreate: `python backend/main.py`

## Next Steps

- Explore the Swagger UI documentation for detailed API schemas
- Test all endpoints with your frontend application
- Monitor logs for any errors or warnings
- Check database for stored data: `sqlite3 data/pocketgone.db`
